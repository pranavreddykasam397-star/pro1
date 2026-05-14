import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.Random;

public class GuessTheSwitch extends JFrame {
    private int realSwitchIndex;
    private int mistakeCount = 0;
    private final int maxMistakes = 3;
    private String gameState = "playing"; // playing, won, lost

    private JPanel bulbPanel;
    private JLabel statusLabel;
    private JLabel mistakesLabel;
    private JButton[] switchButtons;
    private JButton playAgainButton;

    public GuessTheSwitch() {
        setTitle("Mini-Game: Guess the Switch!");
        setSize(400, 450);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout());
        getContentPane().setBackground(new Color(253, 246, 227));

        resetGameLogic();

        JPanel topPanel = new JPanel();
        topPanel.setLayout(new BoxLayout(topPanel, BoxLayout.Y_AXIS));
        
        // Use a container panel for the bulb to keep it centered and rounded-looking
        JPanel bulbContainer = new JPanel(new FlowLayout(FlowLayout.CENTER));
        bulbContainer.setOpaque(false);
        bulbPanel = new JPanel();
        bulbPanel.setPreferredSize(new Dimension(80, 80));
        bulbPanel.setBackground(Color.GRAY);
        bulbContainer.add(bulbPanel);
        
        statusLabel = new JLabel("Guess the switch!", SwingConstants.CENTER);
        statusLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        statusLabel.setFont(new Font("SansSerif", Font.BOLD, 16));
        
        mistakesLabel = new JLabel("Mistakes: " + mistakeCount + " / " + maxMistakes, SwingConstants.CENTER);
        mistakesLabel.setAlignmentX(Component.CENTER_ALIGNMENT);

        topPanel.add(Box.createVerticalStrut(20));
        topPanel.add(bulbContainer);
        topPanel.add(Box.createVerticalStrut(20));
        topPanel.add(statusLabel);
        topPanel.add(mistakesLabel);
        topPanel.add(Box.createVerticalStrut(20));

        JPanel centerPanel = new JPanel(new GridLayout(2, 2, 10, 10));
        centerPanel.setBorder(BorderFactory.createEmptyBorder(0, 20, 20, 20));
        switchButtons = new JButton[4];
        for (int i = 0; i < 4; i++) {
            final int index = i;
            switchButtons[i] = new JButton("Switch " + (i + 1));
            switchButtons[i].setFocusPainted(false);
            switchButtons[i].addActionListener(new ActionListener() {
                @Override
                public void actionPerformed(ActionEvent e) {
                    checkSwitch(index);
                }
            });
            centerPanel.add(switchButtons[i]);
        }

        JPanel bottomPanel = new JPanel();
        playAgainButton = new JButton("Play Again");
        playAgainButton.setVisible(false);
        playAgainButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                resetGameLogic();
                updateUIState();
            }
        });
        bottomPanel.add(playAgainButton);

        add(topPanel, BorderLayout.NORTH);
        add(centerPanel, BorderLayout.CENTER);
        add(bottomPanel, BorderLayout.SOUTH);

        updateUIState();
    }

    private void resetGameLogic() {
        Random rand = new Random();
        realSwitchIndex = rand.nextInt(4);
        mistakeCount = 0;
        gameState = "playing";
    }

    private void checkSwitch(int index) {
        if (!gameState.equals("playing")) return;

        if (index == realSwitchIndex) {
            gameState = "won";
        } else {
            mistakeCount++;
            if (mistakeCount >= maxMistakes) {
                gameState = "lost";
            }
        }
        updateUIState();
    }

    private void updateUIState() {
        mistakesLabel.setText("Mistakes: " + mistakeCount + " / " + maxMistakes);

        if (gameState.equals("won")) {
            bulbPanel.setBackground(new Color(212, 175, 55)); // gold
            statusLabel.setText("You found it! Light is ON.");
            statusLabel.setForeground(new Color(39, 174, 96)); // green
            playAgainButton.setVisible(true);
        } else if (gameState.equals("lost")) {
            bulbPanel.setBackground(Color.BLACK);
            statusLabel.setText("GAME OVER! You failed 3 times.");
            statusLabel.setForeground(new Color(192, 57, 43)); // red
            playAgainButton.setVisible(true);
        } else {
            bulbPanel.setBackground(Color.GRAY);
            if (mistakeCount > 0) {
                statusLabel.setText("Wrong switch! Try again.");
                statusLabel.setForeground(new Color(243, 156, 18)); // orange
            } else {
                statusLabel.setText("Guess the switch!");
                statusLabel.setForeground(Color.BLACK);
            }
            playAgainButton.setVisible(false);
        }

        boolean buttonsEnabled = gameState.equals("playing");
        for (JButton btn : switchButtons) {
            btn.setEnabled(buttonsEnabled);
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            new GuessTheSwitch().setVisible(true);
        });
    }
}
