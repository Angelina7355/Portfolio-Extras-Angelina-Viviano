from picar import PiCar
import time
import argparse
import numpy as np
import cv2
from mod10_func import movingAvg
import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BOARD)
GPIO.setwarnings(False)

def getAngle(img, debug):
                
   hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
   hsv_low = np.array([90, 100, 50])
   hsv_high = np.array([130, 255, 255])

   mask = cv2.inRange(hsv, hsv_low, hsv_high)
   mask_blur = cv2.blur(mask, (5, 5))
   thresh = cv2.threshold(mask_blur, 200, 255, cv2.THRESH_BINARY)[1]

   M = cv2.moments(thresh)
   


   if (M['m00'] > 0):
      cX = int(M['m10']/M['m00'])
      cY = int(M['m01']/M['m00'])

      img_COM = cv2.circle(img, (cX, cY), 5, (0, 0, 255), 2)

      adj = int(img.shape[0] - cY)
      if (cX < img.shape[1]/2):
         opp = int((img.shape[1]/2 - cX))
         angleRads = np.arctan(opp/adj)
         theta = round((angleRads*(180/np.pi) * -1), 2)

      else:
         opp = int(cX - img.shape[1]/2)
         angleRads = np.arctan(opp/adj)
         theta = round((angleRads*(180/np.pi)), 2)


      if (bool(debug) == True):
         cv2.imwrite('img_mask.png', mask)
         cv2.imwrite('img_blur.png', mask_blur)
         cv2.imwrite('img_thresh.png', thresh)
         cv2.imwrite('img_COM.png', img_COM)
         print(f'Angle: {theta}')
         if (M['m00'] > 0):
            print(f'Center of Mass: ({cX}, {cY})')
     
      return theta


   if (M['m00'] == 0):
      theta = 360
      return theta

parser = argparse.ArgumentParser(description = 'Data for this program.')
parser.add_argument('--tim', action = 'store', type = int, default = 10, help = 'Time for program to run in seconds.')
parser.add_argument('--AD_delay', action = 'store', type = float, default = 0.005, help = 'Time between samples of AD converter in seconds.')
parser.add_argument('--motor_delay', action = 'store', type = float, default = 0.125, help = 'Time between calculating motor speed in seconds.')
parser.add_argument('--delay', action = 'store', type = float, default = 0.14, help = 'time between image captures in seconds')
parser.add_argument('--debug', action = 'store_true', help = 'specifies if debug statements are printed')
parser.add_argument('--wait', action = 'store', type = int, default = 3, help = 'Time to wait before starting data collection.')
parser.add_argument('--rps', action = 'store', type = float, default = 6, help = 'Rotations per second.')
parser.add_argument('--Kp', action = 'store', type = float, default = 0, help = 'Proportional')
parser.add_argument('--Ki', action = 'store', type = float, default = 0, help = 'Integral')
parser.add_argument('--Kd', action = 'store', type = float, default = 0, help = 'Derivative')
parser.add_argument('--mock_car', action = 'store_true', help = 'Mock Car set up')

args = parser.parse_args()
car = PiCar(mock_car = args.mock_car, threaded = True)

MAXSIZE = 2010
times = [0]*MAXSIZE
reading = [0]*MAXSIZE
diff = [0]*MAXSIZE
avg = [0]*MAXSIZE
rps = [0]*MAXSIZE
error = [0]*MAXSIZE
sumError = 0
derivError = 0
diff[0] = float(0)
slope = 0.09

initialDC = args.rps*(1/slope)
if (initialDC < 15):
   initialDC = 15
if (initialDC > 100):
   initialDC = 100

once = True
index = 0
counter_AD = 0
counter_RPS = 0
counter_img = 0

delta = 0.4
low_DC = 2.5
high_DC = 12.5
cur_DC = (low_DC + high_DC)/2
low_angle = 0
high_angle = 180
car.set_steer_servo(0)

#while(wait_time + args.wait > cur_time):
   #cur_time = time.time()
   
start_time = time.time()
cur_time = start_time

while (start_time + args.tim > cur_time):
    cur_time = time.time()
    
    # A/D reading information
    if (start_time + args.AD_delay * counter_AD < cur_time):
      reading[index] = car.adc.read_adc(0)
      times[index] = cur_time - start_time
      if (index > 0):
        diff[index] = reading[index] - reading[index - 1]
        avg[index] = round(movingAvg(diff, index),2)
      counter_AD += 1
    
      # motor information
      if (start_time + args.motor_delay * counter_RPS < cur_time):     
        transitions = 0
        start = 0
        stop = 0
        tim_start = 0
        tim_stop = 0
        up = True
        down = False
        
        if (index == 0):
          sample = 100
          maxi = max(diff[1899 : 1999])
          mini = min(diff[1899 : 1999]) 
        elif (counter_RPS > 0):
          if (index < 100):
            sample = index
            extra = 100 - sample
            maxi = max(max(diff[1999 - extra : 1999]), max(diff[0 : sample]))
            mini = min(min(diff[1999 - extra : 1999]), max(diff[0 : sample]))
             
          else:
            sample = 100
            maxi = max(diff[index - sample : index])  
            mini = min(diff[index - sample : index])
        else: 
          sample = index
          maxi = max(diff[0 : sample])
          mini = min(diff[0 : sample])
        max_diff = (maxi - mini)/2
        #if (index > 399):
        threshold = max_diff*0.2
        print (f'Threshold: {threshold}')
        print (f'Moving Average: {avg[index]}')
        #else:
          #threshold = 2000
        pos_thresh = threshold
        neg_thresh = (threshold)*-1
        i = 100

        # rps calculation based on how many wheel rotations the photoresistor detects
        while((transitions < 5) and (i > 0)):
          if (up):
            if(avg[index - i] > pos_thresh):
              up = False
              down = True
              if (transitions == 0):
                tim_start = times[index - i]
              else:
                tim_stop = times[index - i]
              transitions += 1
          elif (down):
            if(avg[index - i] < neg_thresh):
              down = False
              up = True
              if (transitions == 0):
                tim_start = times[index - i]
              else:
                tim_stop = times[index - i]
              transitions += 1
          i -= 1
          if (transitions <= 1):
            rps[index] = 0
          else:
            rps[index] = ((transitions - 1)/(tim_stop - tim_start))*(1/4)
            if (rps[index] >= 10):      #doesn't work with wrapping
              rps[index] = rps[index - 1]
            if (rps[index] <= rps[index - 1]*0.5) and (index > 0):
              rps[index] = rps[index - 1]
            if (rps[index] >= rps[index - 1]*1.3) and (index > 900):
              rps[index] = rps[index - 1]
            if ((rps[index] == 0) and (rps[index - 1] != 0) and (index > 0)):
              rps[index] = rps[index - 1]

        error[index] = args.rps - rps[index]
        sumError += error[index]
        derivError = error[index]-error[index-1] 
        desiredDC = args.rps*(1/slope)
        newDC = desiredDC + args.Kp*error[index] + args.Ki*sumError + args.Kd*derivError
        if (args.rps <= 3.5):  # so control does not take effect until 1 second has passed and helps get car moving (for demoing)
          if (index< 200):
            newDC = desiredDC*2.5
            #newDC = 60
        if (args.rps == 4):
          if (index < 250):
            #newDC = desiredDC*2.5
            newDC = 60
        if (args.rps >= 5):
          if (index < 275):
            #newDC = desiredDC*2.5
            newDC = 60
        if (newDC < 15):
          newDC = 15
        if (newDC > 100):
          newDC = 100
        car.set_motor(newDC)
        print(f'Motor DC: {newDC}')
        counter_RPS += 1        
        print(f'Time: {times[index]:0.2f}\tReading: {reading[index]}\tRPS: {rps[index]:0.2f}\t Error: {error[index]:0.2f}\n')        
      else:
        if(index == 0):
          rps[index] = rps[1999]
        else:
          rps[index] = rps[index - 1]
      index += 1  
      index = index % 2010
      
 # get image and angle
    if (cur_time > start_time + (counter_img * args.delay)):
      image = car.get_image()
  #    image_array = np.array(image)
      if (image is not None):
        angle = getAngle(image, args.debug)
        print('Completed getAngle Method:')
#     cv2.imwrite('check.png', image)
      else:
        print('Did not Complete getAngle Method:')
        angle = 360
      print(f'Angle: {angle}')

      if (((angle < -25) or (angle > 25)) and (angle != 360)):
        new_DC = cur_DC + delta*angle*(high_DC - low_DC)/(high_angle - low_angle)
        if ((new_DC >= low_DC) and (new_DC <= high_DC)):
          cur_DC = new_DC
          dcToSteer = -2*(new_DC - 7.5)
          if ((dcToSteer < 0) and (angle < 0)):
            dcToSteer = dcToSteer*-1
            dcToSteer = 8 - dcToSteer 
          elif ((dcToSteer > 0) and (angle > 0)):
            dcToSteer = dcToSteer*-1
            dcToSteer = 8 + dcToSteer
        distance = car.read_distance()
        if (distance is None):
          distance = 0
        else:
          tim = distance/(args.rps * 21)
          if (args.rps < 7):
            if (tim < 0.6):
              car.stop()
             # index_stop = index
              break
          else:
            if (tim < 0.625):
              car.stop()
              #index_stop = index
              break
        print (f'Steer DC: {dcToSteer}')
        car.set_steer_servo(dcToSteer)
      else: 
        car.set_steer_servo(0)
        distance = car.read_distance()
        print(f'Dist: {distance}')
        if (distance is None):
          distance = 0
        else:
          tim = distance/(args.rps * 21)      # time = distance/speed  (rps*circumference = speed)
          if (args.rps < 7):
            if (tim < 0.6):
              print("STOPPED CAR")
              car.stop()
              break
          else:
            if (tim < 0.625):
              car.stop()
              break
      counter_img += 1

        
GPIO.cleanup()

with open(f'obj3.txt','w') as data:
  j = 0
  while (j < len(reading)):
    data.write(f'{times[j]:0.2f}\t{reading[j]}\t{rps[j]}\n')
    j += 1
