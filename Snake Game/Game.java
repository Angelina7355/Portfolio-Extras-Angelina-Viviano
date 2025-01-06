package assignment9;

import java.awt.event.KeyEvent;

import edu.princeton.cs.introcs.StdDraw;

public class Game {
	
	private Snake snake;
	private Food food;
	private int applesConsumedCount;
	
	public Game() {
		StdDraw.enableDoubleBuffering();
		this.snake = new Snake();
		this.food = new Food();
		this.applesConsumedCount = 0;
	}
	
	public void play() {
		while (snake.isInbounds()) { 
			int dir = getKeypress();
			snake.changeDirection(dir);
			snake.move();
			if (snake.eatFood(food)) {		// replace old apple with new (different location) apple if snake ate the old one
				food = new Food();
				applesConsumedCount++;
			}
			updateDrawing();
			// TODO add the game components
		}
		StdDraw.text(0.5, 0.5, "you r bad");
	}
	
	private int getKeypress() {
		if(StdDraw.isKeyPressed(KeyEvent.VK_SPACE)) {
			return 10;
		}
		if(StdDraw.isKeyPressed(KeyEvent.VK_W)) {
			return 1;
		} else if (StdDraw.isKeyPressed(KeyEvent.VK_S)) {
			return 2;
		} else if (StdDraw.isKeyPressed(KeyEvent.VK_A)) {
			return 3;
		} else if (StdDraw.isKeyPressed(KeyEvent.VK_D)) {
			return 4;
		} else {
			return -1;
		}
	}
	
	/**
	 * Clears the screen, draws the snake and food, pauses, and shows the content
	 */
	private void updateDrawing() {
		StdDraw.clear();
		// What do you need to draw in each frame?
		snake.draw();
		food.draw();
		drawAppleCount();
		StdDraw.pause(50);
		StdDraw.show();
	}
	
	public void drawAppleCount() {
		StdDraw.setPenColor(StdDraw.BLACK);
		StdDraw.text(0.2, 0.95, "Apples Consumed: " + applesConsumedCount);
	}
	
	public static void main(String[] args) {
		Game g = new Game();
		g.play();
	}
}
