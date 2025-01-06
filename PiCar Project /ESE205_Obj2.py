import time
from time import sleep
import argparse
import RPi.GPIO as GPIO
import cv2
import numpy as np
GPIO.setmode(GPIO.BOARD)
GPIO.setwarnings(False)
from picar import PiCar

# define angle-measuring function:
# locates the center of mass of the dark blue color detected from the camera, and calculates its angle from the PiCar to
# determine how much the wheels need to turn for the car to drive directly toward the blue object
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


parser = argparse.ArgumentParser(description = 'Date for this program.')
parser.add_argument('--tim', action = 'store', type = int, default = 10, help = 'time for program to run in seconds')
parser.add_argument('--delay', action = 'store', type = float, default = 0.05, help = 'time between image captures in seconds')
parser.add_argument('--debug', action = 'store_true', help = 'specifies if debug statements are printed')
parser.add_argument('--mock_car', action = 'store_true', help = "Mock Car")
args = parser.parse_args()

car = PiCar(mock_car = args.mock_car, threaded = True)

start_time = time.time()
delta = 0.4
cur_time = start_time
low_DC = 2.5
high_DC = 12.5
cur_DC = (low_DC + high_DC)/2
low_angle = 0
high_angle = 180
counter = 0

car.set_steer_servo(0)
#car.set_steer_servo(2*(cur_DC-7.5))      this is redundant since wheels should always start centered
sleep(args.delay)
car.set_motor(100, forward = True)

while (start_time + args.tim > cur_time):
   cur_time = time.time()

   if (cur_time > start_time + (counter * args.delay)):
     image = car.get_image()
     image_array = np.array(image)
     if (np.any(image_array != None)):
        angle = getAngle(image, args.debug)
        print('Completed getAngle Method:')
        print(angle)
     else:
        print('Did not Complete getAngle Method:')
        angle = 360
     print(angle)

     if (((angle < -25) or (angle > 25)) and (angle != 360)):
        new_DC = cur_DC + delta*angle*(high_DC - low_DC)/(high_angle - low_angle)
        if ((new_DC >= low_DC) and (new_DC <= high_DC)):
           cur_DC = new_DC
           dcToSteer = -2*(new_DC - 7.5)

           if ((dcToSteer < 0) and (angle < 0)):
             dcToSteer = dcToSteer*-1
           elif ((dcToSteer > 0) and (angle > 0)):
             dcToSteer = dcToSteer*-1
           print (f'DC: {dcToSteer}')
           car.set_steer_servo(dcToSteer)
        #  sleep(args.delay)
           if (counter % 4 == 0):
             cv2.imwrite(f'test{counter}.png',image)
             print ('picture taken')
           distance = car.read_distance()
           if (distance is None):
             distance = 0
           car.set_motor(70, forward = True)
           if (distance < 150):
             car.set_motor(40, forward = True)
     else: 
        car.set_steer_servo(0)
        distance = car.read_distance()
        print(f'Dist: {distance}')
        if (distance is None):
          distance = 0
        if (distance < 30):
          car.stop()
 #       elif (distance < 100):
#          car.set_motor(100, forward = False) #Decrease this DC (maybe)
        elif (distance < 175):
          car.set_motor(50, forward = True)
        elif (distance > 200):
          car.set_motor(100, forward = True)
          
     counter += 1

#GPIO
