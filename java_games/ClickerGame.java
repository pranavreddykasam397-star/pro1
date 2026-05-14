import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class ClickerGame extends JFrame {
    private int clicks = 0;
    private int timeLeft = 15;
    private final int targetClicks = 50;
    private String gameState = "idle"; // idle, playing, won, lost
    private Timer timer;

    private JLabel timeLabel;
    private JLabel clickLabel;
    private JLabel statusLabel;
    private JButton clickButton;
    private JButton retryButton;

    public ClickerGame() {
        setTitle("Speed Clicker Game");
        setSize(400, 350);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout());
        getContentPane().setBackground(new Color(253, 246, 227)); // cream

        JPanel topPanel = new JPanel(new GridLayout(1, 2));
        timeLabel = new JLabel("Time Left: " + timeLeft + "s", SwingConstants.CENTER);
        timeLabel.setFont(new Font("Serif", Font.BOLD, 20));
        clickLabel = new JLabel("Clicks: " + clicks + "/" + targetClicks, SwingConstants.CENTER);
        clickLabel.setFont(new Font("Serif", Font.BOLD, 20));
        topPanel.add(timeLabel);
        topPanel.add(clickLabel);

        statusLabel = new JLabel("Click 50 times in 15 seconds!", SwingConstants.CENTER);
        statusLabel.setFont(new Font("SansSerif", Font.BOLD, 16));
        
        clickButton = new JButton("START CLICKING!");
        clickButton.setFont(new Font("SansSerif", Font.BOLD, 24));
        clickButton.setBackground(new Color(212, 175, 55)); // gold
        clickButton.setForeground(Color.WHITE);
        clickButton.setFocusPainted(false);

        retryButton = new JButton("Try Again");
        retryButton.setVisible(false);

        JPanel centerPanel = new JPanel(new GridLayout(3, 1, 10, 10));
        centerPanel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        centerPanel.add(statusLabel);
        centerPanel.add(clickButton);
        centerPanel.add(retryButton);

        add(topPanel, BorderLayout.NORTH);
        add(centerPanel, BorderLayout.CENTER);

        timer = new Timer(1000, new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                if (gameState.equals("playing") && timeLeft > 0) {
                    timeLeft--;
                    updateUIState();
                    if (timeLeft == 0 && !gameState.equals("won")) {
                        gameState = "lost";
                        updateUIState();
                    }
                }
            }
        });

        clickButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                if (gameState.equals("won") || gameState.equals("lost")) return;

                if (gameState.equals("idle")) {
                    gameState = "playing";
                    timer.start();
                }

                clicks++;
                
                if (clicks >= targetClicks && timeLeft > 0) {
                    gameState = "won";
                    timer.stop();
                }
                updateUIState();
            }
        });

        retryButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                clicks = 0;
                timeLeft = 15;
                gameState = "idle";
                timer.stop();
                updateUIState();
            }
        });

        updateUIState();
    }

    private void updateUIState() {
        timeLabel.setText("Time Left: " + timeLeft + "s");
        clickLabel.setText("Clicks: " + clicks + "/" + targetClicks);

        if (gameState.equals("idle")) {
            statusLabel.setText("Click 50 times in 15 seconds!");
            statusLabel.setForeground(Color.BLACK);
            clickButton.setText("START CLICKING!");
            clickButton.setBackground(new Color(212, 175, 55));
            retryButton.setVisible(false);
            clickButton.setEnabled(true);
        } else if (gameState.equals("playing")) {
            statusLabel.setText("Click 50 times in 15 seconds!");
            clickButton.setText("CLICK ME!");
            retryButton.setVisible(false);
        } else if (gameState.equals("won")) {
            statusLabel.setText("🎉 You won the discount! 🎉");
            statusLabel.setForeground(new Color(39, 174, 96));
            clickButton.setText("WINNER!");
            clickButton.setBackground(new Color(39, 174, 96));
            retryButton.setVisible(true);
            clickButton.setEnabled(false);
        } else if (gameState.equals("lost")) {
            statusLabel.setText("Too slow! Game Over.");
            statusLabel.setForeground(new Color(192, 57, 43));
            clickButton.setText("FAILED");
            clickButton.setBackground(Color.GRAY);
            retryButton.setVisible(true);
            clickButton.setEnabled(false);
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            new ClickerGame().setVisible(true);
        });
    }
}
