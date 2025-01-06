from picar import PiCar
import time
import argparse
import numpy as np
from mod10_func import movingAvg
import RPi.GPIO as GPIO
GPIO.setwarnings(False)

parser = argparse.ArgumentParser(description = 'Data for this program.')
parser.add_argument('--tim', action = 'store', type = int, default = 10, help = 'Time for program to run in seconds.')
parser.add_argument('--AD_delay', action = 'store', type = float, default = 0.005, help = 'Time between samples of AD converter in seconds.')
parser.add_argument('--motor_delay', action = 'store', type = float, default = 0.25, help = 'Time between calculating motor speed in seconds.')
parser.add_argument('--wait', action = 'store', type = int, default = 3, help = 'Time to wait before starting data collection.')
parser.add_argument('--rps', action = 'store', type = float, default = 6, help = 'Rotations per second.')
parser.add_argument('--Kp', action = 'store', type = float, default = 0, help = 'Proportional')
parser.add_argument('--Ki', action = 'store', type = float, default = 0, help = 'Integral')
parser.add_argument('--Kd', action = 'store', type = float, default = 0, help = 'Derivative')
parser.add_argument('--mock_car', action = 'store_true', help = 'Mock Car set up')

args = parser.parse_args()
car = PiCar(mock_car = args.mock_car)

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
cur_time = time.time()
index = 0
counter_AD = 0
counter_RPS = 0
wait_time = time.time()

# calculate rps based on how many wheel rotations the photoresistor detects
while(wait_time + args.wait > cur_time):
   cur_time = time.time()
   
start_time = time.time()
cur_time = start_time

while (start_time + args.tim > cur_time):
    cur_time = time.time()
    
    if (start_time + args.AD_delay * counter_AD < cur_time):
      reading[index] = car.adc.read_adc(0)
      times[index] = cur_time - start_time
      if (index > 0):
        diff[index] = reading[index] - reading[index - 1]
        avg[index] = round(movingAvg(diff, index),2)
      counter_AD += 1
    
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
        if (index > 399):
          threshold = max_diff*0.2
          print (threshold)
          print (avg[index])
        else:
          threshold = 2000
        pos_thresh = threshold
        neg_thresh = (threshold)*-1
        i = 100
      
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
          if (transitions <= 2):
            rps[index] = 0
          else:
            rps[index] = ((transitions - 1)/round((tim_stop - tim_start),2))*(1/4)
            if (rps[index] >= 10):      #doesn't work with wrapping
              rps[index] = rps[index - 1]
            elif ((rps[index] <= rps[index - 1]*0.5) and (index > 500)):
              rps[index] = rps[index - 1]
        if (index <= 400):
            error[index] = 0
        else:
          error[index] = args.rps - rps[index]
          sumError += error[index]
          derivError = error[index]-error[index-1] 
          desiredDC = args.rps*(1/slope)
          newDC = desiredDC + args.Kp*error[index] + args.Ki*sumError + args.Kd*derivError
          if (newDC < 15):
            newDC = 15
          if (newDC > 100):
            newDC = 100
          car.set_motor(newDC)
          print(f'DC: {newDC}')
        counter_RPS += 1        
        print(f'Time: {times[index]:0.2f}\tReading: {reading[index]}\tRPS: {rps[index]:0.2f}\t Error: {error[index]:0.2f}\n')        
      else:
        if(index == 0):
          rps[index] = rps[1999]
        else:
          rps[index] = rps[index - 1]
      index += 1  
      index = index % 2010      

    if(cur_time >= start_time + 2 and once):
      car.set_motor(initialDC, forward = True)
      once = False

        
car.set_motor(0)
GPIO.cleanup()

#with open(f'car_noload_3rps.txt','w') as data:
with open('car_noload_3rps.txt','w') as data:
  j = 0
  while (j < len(reading)):
    data.write(f'{times[j]:0.2f}\t{reading[j]}\t{rps[j]}\t{diff[j]}\n')
    j += 1
