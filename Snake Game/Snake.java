package assignment9;

import java.util.LinkedList;

import assignment8.Entity;

public class Snake {

	private static final double SEGMENT_SIZE = 0.01;
	private static double MOVEMENT_SIZE = SEGMENT_SIZE * 1.5;
	private LinkedList<BodySegment> segments;
	private double deltaX;
	private double deltaY;
	private int currentDirection;
	private ColorUtils segColor;
	
	public Snake() {
		this.segments = new LinkedList<BodySegment>();
		segments.add(new BodySegment(0.5, 0.5, SEGMENT_SIZE));
		deltaX = 0;
		deltaY = 0;
		currentDirection = 0;
		segColor = new ColorUtils();
	}
	
	public BodySegment getHead() {
		return this.segments.get(0);
	}
	
	public BodySegment getTail() {
		return this.segments.getLast();
	}

	public void changeDirection(int direction) {
		currentDirection = direction;
		if(direction == 1) { //up
			deltaY = MOVEMENT_SIZE;
			deltaX = 0;
		} else if (direction == 2) { //down
			deltaY = -MOVEMENT_SIZE;
			deltaX = 0;
		} else if (direction == 3) { //left
			deltaY = 0;
			deltaX = -MOVEMENT_SIZE;
		} else if (direction == 4) { //right
			deltaY = 0;
			deltaX = MOVEMENT_SIZE;
		}
	}
	
	/**
	 * Moves the snake by updating the position of each of the segments
	 * based on the current direction of travel
	 */
	public void move() {
		/*
		for (int i = 0; i < segments.size(); i++) {
			BodySegment seg = segments.get(i);
			seg.setX(seg.getX() + deltaX);
			seg.setY(seg.getY() + deltaY);
		}*/
		
		// Move the tail to the position of the segment in front of it
	    for (int i = segments.size() - 1; i > 0; i--) {			// loops from the last segment to the second segment in the list (since the second segment is the last to be updated, only the second segment will be updated with the head's new position; the third segment won't get this update until the next update, and so on...
	        BodySegment currentSegment = segments.get(i);
	        BodySegment precedingSegment = segments.get(i - 1);
	        currentSegment.setX(precedingSegment.getX());
	        currentSegment.setY(precedingSegment.getY());
	    }

	    // Move the head segment based on the current direction
	    BodySegment head = getHead();
	    head.setX(head.getX() + deltaX);
	    head.setY(head.getY() + deltaY);
	}
	
	/**
	 * Draws the snake by drawing each segment
	 */
	public void draw() {
		for(BodySegment seg : segments) {
			//seg.newColor();
			ColorUtils.solidColor();
			seg.draw();
		}
	}
	
	/**
	 * The snake attempts to eat the given food, growing if it does so successfully
	 * @param f the food to be eaten
	 * @return true if the snake successfully ate the food
	 */
	public boolean eatFood(Food f) {
		// TODO
		if (this.isTouching(f)) {
			segments.add(new BodySegment(getTail().getX() + SEGMENT_SIZE, getTail().getY() + SEGMENT_SIZE, SEGMENT_SIZE));
			return true;
		} 
		else {
			return false;
		}
	}
	
	
	/**
	 * @param xOther x-coordinate of the other point.
	 * @param yOther y-coordinate of the other point.
	 * @return distance between this segment's center and the specified other point.
	 */
	public double distanceCenterToPoint(double xOther, double yOther) {
		return Math.sqrt(Math.pow(this.getHead().getX() - xOther, 2) + Math.pow(this.getHead().getY() - yOther, 2));
	}
	
	/**
	 * @param xOther      the x-coordinate of the Food's center.
	 * @param yOther      the y-coordinate of the Food's center.
	 * @param radiusOther the radius of the food.
	 * @return the distance between this segment edge and the specified
	 *         Food's edge.
	 */
	public double distanceEdgeToEdge(double xOther, double yOther, double radiusOther) {
		return distanceCenterToPoint(xOther, yOther) - (SEGMENT_SIZE + radiusOther);
	}
	

	/**
	 * @param xOther      the x-coordinate of the Food's center.
	 * @param yOther      the y-coordinate of the Food's center.
	 * @param radiusOther the radius of the Food.
	 * @return true if the bounding circle of this segment overlaps with the bounding
	 *         circle of the specified Food, false otherwise.
	 */
	public boolean isTouching(Food f) {
		return distanceEdgeToEdge(f.getX(), f.getY(), f.getRadius()) <= 0;
	}
	
	
	
	/**
	 * Returns true if the head of the snake is in bounds
	 * @return whether or not the head is in the bounds of the window
	 */
	public boolean isInbounds() {
		return (this.getHead().getX() > 0.0 && this.getHead().getX() < 1.0 && this.getHead().getY() > 0.0 && this.getHead().getY() < 1.0);
	}
	
}
