package assignment9;

import java.awt.Color;

import edu.princeton.cs.introcs.StdDraw;

public class BodySegment {
	private static Color[] randomColors = {StdDraw.ORANGE, StdDraw.YELLOW, StdDraw.GREEN, StdDraw.BLUE, StdDraw.MAGENTA, StdDraw.PINK, StdDraw.CYAN};
	private double x, y, size;
	private Color color;
	
	public BodySegment(double x, double y, double size) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.color = randomColors[(int) (Math.random() * randomColors.length)];
	}
	
	/**
	 * Draws the segment
	 */
	public void draw() {
		StdDraw.setPenColor(color);
		StdDraw.filledCircle(x, y, size);
	}
	
	
	public void newColor() {
		this.color = randomColors[(int) (Math.random() * randomColors.length)];
	}
	
	
	public void setX(double newX) {
		this.x = newX;
	}
	
	
	public void setY(double newX) {
		this.y = newX;
	}
	
	
	public void updateX(double updateBy) {
		this.x += updateBy;
	}
	
	
	public void updateY(double updateBy) {
		this.y += updateBy;
	}
	
	
	public double getX() {
		return x;
	}
	
	
	public double getY() {
		return y;
	}
}
