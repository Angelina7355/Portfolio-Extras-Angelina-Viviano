# Remote Control Car Code Utilizing Python, the Raspberry Pi, & Linux OS
## Project for ESE 205: Electrical and Systems Engineering-Introduction to Engineering Design
- A semester-long project completed in collaboration with one partner.
- Goal: Design a remote-control car using Linux OS, a Raspberry Pi, and its accessories including the Pi camera, ultrasonic sensor,
A/D Converter, accelerometer, photoresistor, H-bridge, DC motors, servo motors, etc.
   - Pi Car drives at a desired rps using a closed-loop-system and a PID (proportional-integral-derivative) algorithm
   - Pi Car uses camera attached swivel motor to to find dark blue object(recycling bin) and angle wheels to drive toward it
   - Pi Car drives toward recylcing bin at desired rps while turning wheels when necessary to reach recycling bin and stops as
  close to the recycling bin as possible without touching it
      - Utilizes the "PiCar Class" Developed for the Course: https://github.com/ESE205/PiCar

## File Descriptions
- ESE205_Obj1.py:           Data collection for speed (rps) calculation
- ESE205_Obj2.py:           Drives toward the wall without touching it
- ESE205_Obj3.py:           Drives toward an object at a given speed
- mod10_func.py:            Prewritten functions used in Pi Car objectives
- plot_velocity_obj3.png:   Plot of velocity of Pi Car when given speed was 3rps
