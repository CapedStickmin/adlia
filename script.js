class ChessGame {
    constructor() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.lastMove = null;
        this.captureMinigameActive = false;
        this.captureMinigameData = null;
        this.keyCooldowns = null;
        this.initializeBoard();
        this.renderBoard();
        this.setupEventListeners();
        this.updateTurnIndicator();
        this.updateBoardPerspective();
        this.setupBloodEffect();
        this.setupCaptureMinigame();
    }

    initializeBoard() {
        // Initialize pawns
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = { type: 'pawn', color: 'black', symbol: '♟', hasMoved: false };
            this.board[6][i] = { type: 'pawn', color: 'white', symbol: '♙', hasMoved: false };
        }

        // Initialize rooks
        this.board[0][0] = { type: 'rook', color: 'black', symbol: '♜', hasMoved: false };
        this.board[0][7] = { type: 'rook', color: 'black', symbol: '♜', hasMoved: false };
        this.board[7][0] = { type: 'rook', color: 'white', symbol: '♖', hasMoved: false };
        this.board[7][7] = { type: 'rook', color: 'white', symbol: '♖', hasMoved: false };

        // Initialize knights
        this.board[0][1] = { type: 'knight', color: 'black', symbol: '♞', hasMoved: false };
        this.board[0][6] = { type: 'knight', color: 'black', symbol: '♞', hasMoved: false };
        this.board[7][1] = { type: 'knight', color: 'white', symbol: '♘', hasMoved: false };
        this.board[7][6] = { type: 'knight', color: 'white', symbol: '♘', hasMoved: false };

        // Initialize bishops
        this.board[0][2] = { type: 'bishop', color: 'black', symbol: '♝', hasMoved: false };
        this.board[0][5] = { type: 'bishop', color: 'black', symbol: '♝', hasMoved: false };
        this.board[7][2] = { type: 'bishop', color: 'white', symbol: '♗', hasMoved: false };
        this.board[7][5] = { type: 'bishop', color: 'white', symbol: '♗', hasMoved: false };

        // Initialize queens
        this.board[0][3] = { type: 'queen', color: 'black', symbol: '♛', hasMoved: false };
        this.board[7][3] = { type: 'queen', color: 'white', symbol: '♕', hasMoved: false };

        // Initialize kings
        this.board[0][4] = { type: 'king', color: 'black', symbol: '♚', hasMoved: false };
        this.board[7][4] = { type: 'king', color: 'white', symbol: '♔', hasMoved: false };
    }

    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                
                // Add last-move highlight
                if (this.lastMove && 
                    ((row === this.lastMove.fromRow && col === this.lastMove.fromCol) ||
                     (row === this.lastMove.toRow && col === this.lastMove.toCol))) {
                    square.classList.add('last-move');
                }
                
                square.dataset.row = row;
                square.dataset.col = col;

                if (this.board[row][col]) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${this.board[row][col].color}`;
                    piece.textContent = this.board[row][col].symbol;
                    square.appendChild(piece);
                }

                boardElement.appendChild(square);
            }
        }
        
        this.setupBloodEffect();
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        const currentPlayerText = this.currentPlayer === 'white' ? 'White' : 'Black';
        indicator.textContent = `${currentPlayerText}'s turn`;
        indicator.style.color = this.currentPlayer === 'white' ? '#ffffff' : '#000000';
        indicator.style.backgroundColor = this.currentPlayer === 'white' ? '#000000' : '#ffffff';
    }

    setupEventListeners() {
        const board = document.getElementById('board');
        board.addEventListener('click', (e) => {
            // Don't allow moves when minigame is active
            if (this.captureMinigameActive) return;
            
            const square = e.target.classList.contains('piece') ? 
                e.target.parentElement : 
                e.target.closest('.square');
                
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const piece = this.board[row][col];

            // Clear previous selection
            document.querySelectorAll('.square').forEach(sq => {
                sq.classList.remove('selected', 'valid-move');
            });

            if (this.selectedPiece) {
                const [fromRow, fromCol] = this.selectedPiece;
                const isValidMove = this.validMoves.some(([r, c]) => r === row && c === col);

                if (isValidMove) {
                    this.movePiece(fromRow, fromCol, row, col);
                    
                    // Only render board if we didn't start a minigame
                    if (!this.captureMinigameActive) {
                        this.renderBoard();
                    }
                    
                    this.selectedPiece = null;
                    this.validMoves = [];
                } else if (piece && piece.color === this.currentPlayer) {
                    // If clicking on own piece, select it instead
                    this.selectedPiece = [row, col];
                    this.validMoves = this.getValidMoves(row, col);
                    square.classList.add('selected');
                    this.highlightValidMoves();
                } else {
                    this.selectedPiece = null;
                    this.validMoves = [];
                }
            } else if (piece && piece.color === this.currentPlayer) {
                this.selectedPiece = [row, col];
                this.validMoves = this.getValidMoves(row, col);
                square.classList.add('selected');
                this.highlightValidMoves();
            }
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            // Don't allow reset when minigame is active
            if (this.captureMinigameActive) return;
            
            this.board = Array(8).fill().map(() => Array(8).fill(null));
            this.currentPlayer = 'white';
            this.selectedPiece = null;
            this.validMoves = [];
            this.initializeBoard();
            this.renderBoard();
            this.updateTurnIndicator();
            this.updateBoardPerspective();
        });
    }

    highlightValidMoves() {
        // First clear any existing highlights and threatened pieces
        document.querySelectorAll('.move-indicator').forEach(el => el.remove());
        document.querySelectorAll('.piece').forEach(el => el.classList.remove('threatened-piece'));
        
        // Piece values for comparison
        const pieceValues = {
            'pawn': 1,
            'knight': 3,
            'bishop': 3,
            'rook': 5,
            'queen': 9,
            'king': 10
        };
        
        // Get the attacking piece
        const [fromRow, fromCol] = this.selectedPiece;
        const attackingPiece = this.board[fromRow][fromCol];
        const attackerValue = pieceValues[attackingPiece.type];
        
        // Add modern indicators for valid moves
        this.validMoves.forEach(([r, c]) => {
            const validSquare = document.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
            if (!validSquare) return;
            
            // Mark square as valid move
            validSquare.classList.add('valid-move');
            
            // Create modern indicator element
            const indicator = document.createElement('div');
            
            // If the move is a capture (square has a piece), show different indicator
            if (validSquare.querySelector('.piece')) {
                // This is a capturable piece
                indicator.className = 'move-indicator capture-indicator';
                
                // Make the piece shake if it's weaker than the attacking piece
                const defendingPiece = this.board[r][c];
                const defenderValue = pieceValues[defendingPiece.type];
                
                if (defenderValue < attackerValue) {
                    // This is a weaker piece that will likely be captured - make it shake
                    const pieceElement = validSquare.querySelector('.piece');
                    pieceElement.classList.add('threatened-piece');
                }
            } else {
                indicator.className = 'move-indicator';
            }
            
            validSquare.appendChild(indicator);
        });
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // If there's a piece to capture, start minigame
        if (capturedPiece) {
            const minigameStarted = this.startCaptureMinigame(fromRow, fromCol, toRow, toCol);
            if (minigameStarted) {
                return; // Wait for minigame to complete
            }
        }
        
        // No capture or minigame not started, proceed with normal move
        // Store the last move
        this.lastMove = {
            fromRow,
            fromCol,
            toRow,
            toCol,
            piece: piece
        };
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        if (piece.type === 'pawn' || piece.type === 'king' || piece.type === 'rook') {
            piece.hasMoved = true;
        }

        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.updateTurnIndicator();
        this.updateBoardPerspective();
    }

    isValidMove(row, col, piece) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return false;
        const target = this.board[row][col];
        
        if (piece.type === 'pawn') {
            // For pawns, forward movement must be to an empty square
            const direction = piece.color === 'white' ? -1 : 1;
            if (col === this.selectedPiece[1]) { // Forward movement
                return !target; // Must move to an empty square
            }
        }
        
        return !target || target.color !== piece.color;
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const moves = [];
        const direction = piece.color === 'white' ? -1 : 1;

        switch (piece.type) {
            case 'pawn':
                // Forward move
                if (!this.board[row + direction]?.[col]) {
                    moves.push([row + direction, col]);
                    // Double move from starting position
                    if (!piece.hasMoved && !this.board[row + 2 * direction]?.[col]) {
                        moves.push([row + 2 * direction, col]);
                    }
                }
                // Capture moves
                for (const dcol of [-1, 1]) {
                    const newRow = row + direction;
                    const newCol = col + dcol;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 &&
                        this.board[newRow][newCol] && 
                        this.board[newRow][newCol].color !== piece.color) {
                        moves.push([newRow, newCol]);
                    }
                }
                break;

            case 'rook':
                for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    let newRow = row + dr;
                    let newCol = col + dc;
                    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        if (!this.board[newRow][newCol]) {
                            moves.push([newRow, newCol]);
                        } else if (this.board[newRow][newCol].color !== piece.color) {
                            moves.push([newRow, newCol]);
                            break;
                        } else {
                            break;
                        }
                        newRow += dr;
                        newCol += dc;
                    }
                }
                break;

            case 'knight':
                for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 &&
                        (!this.board[newRow][newCol] || this.board[newRow][newCol].color !== piece.color)) {
                        moves.push([newRow, newCol]);
                    }
                }
                break;

            case 'bishop':
                for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    let newRow = row + dr;
                    let newCol = col + dc;
                    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        if (!this.board[newRow][newCol]) {
                            moves.push([newRow, newCol]);
                        } else if (this.board[newRow][newCol].color !== piece.color) {
                            moves.push([newRow, newCol]);
                            break;
                        } else {
                            break;
                        }
                        newRow += dr;
                        newCol += dc;
                    }
                }
                break;

            case 'queen':
                for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    let newRow = row + dr;
                    let newCol = col + dc;
                    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        if (!this.board[newRow][newCol]) {
                            moves.push([newRow, newCol]);
                        } else if (this.board[newRow][newCol].color !== piece.color) {
                            moves.push([newRow, newCol]);
                            break;
                        } else {
                            break;
                        }
                        newRow += dr;
                        newCol += dc;
                    }
                }
                break;

            case 'king':
                for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 &&
                        (!this.board[newRow][newCol] || this.board[newRow][newCol].color !== piece.color)) {
                        moves.push([newRow, newCol]);
                    }
                }
                break;
        }

        return moves;
    }

    setupBloodEffect() {
        const boardElement = document.getElementById('board');
        const bloodEffect = document.createElement('div');
        bloodEffect.className = 'blood-effect';
        boardElement.appendChild(bloodEffect);
        this.bloodEffect = bloodEffect;
    }

    showBloodEffect(x, y) {
        this.bloodEffect.style.left = x + 'px';
        this.bloodEffect.style.top = y + 'px';
        this.bloodEffect.classList.add('active');
        
        setTimeout(() => {
            this.bloodEffect.classList.remove('active');
        }, 1000);
    }

    updateBoardPerspective() {
        const boardElement = document.getElementById('board');
        boardElement.className = 'chess-board ' + 
            (this.currentPlayer === 'white' ? 'white-perspective' : 'black-perspective');
    }

    setupCaptureMinigame() {
        // Create minigame container
        const container = document.createElement('div');
        container.id = 'capture-minigame';
        container.className = 'capture-minigame';
        
        // Create sword and shield battle area
        const battleArea = document.createElement('div');
        battleArea.className = 'battle-area';
        
        // Create attacker (sword)
        const attacker = document.createElement('div');
        attacker.className = 'battle-piece attacker';
        attacker.innerHTML = '<div class="piece-symbol"></div><div class="weapon sword">⚔️</div>';
        battleArea.appendChild(attacker);
        
        // Create defender (shield)
        const defender = document.createElement('div');
        defender.className = 'battle-piece defender';
        defender.innerHTML = '<div class="piece-symbol"></div><div class="weapon shield">🛡️</div>';
        battleArea.appendChild(defender);
        
        // Create combat indicator
        const combatIndicator = document.createElement('div');
        combatIndicator.className = 'combat-indicator';
        combatIndicator.innerHTML = 'VS';
        battleArea.appendChild(combatIndicator);
        
        container.appendChild(battleArea);
        
        // Create timer
        const timer = document.createElement('div');
        timer.className = 'minigame-timer';
        container.appendChild(timer);
        
        // Create block counter
        const blockCounter = document.createElement('div');
        blockCounter.className = 'block-counter';
        blockCounter.innerHTML = 'Blocks: <span>0</span>/5';
        container.appendChild(blockCounter);
        
        // Create instructions
        const instructions = document.createElement('div');
        instructions.className = 'minigame-instructions';
        instructions.innerHTML = 'Attacker: Press W to strike!<br>Defender: Press B to block!';
        container.appendChild(instructions);
        
        // Create feedback area
        const feedbackArea = document.createElement('div');
        feedbackArea.className = 'combat-feedback';
        container.appendChild(feedbackArea);
        
        document.body.appendChild(container);
        this.minigameElement = container;
    }

    startCaptureMinigame(fromRow, fromCol, toRow, toCol) {
        const attackingPiece = this.board[fromRow][fromCol];
        const defendingPiece = this.board[toRow][toCol];
        
        if (!defendingPiece) return false;
        
        // Don't allow king capture - king must always win the minigame
        if (defendingPiece.type === 'king') {
            // Display special message that kings cannot be captured
            alert("Kings cannot be captured - they must be checkmated! Your piece commits suicide rather than attacking a king.");
            
            // Show the attacking piece death animation
            const attackingSquare = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
            const attackerPiece = attackingSquare.querySelector('.piece');
            const rect = attackingSquare.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Show blood effect and death animation
            this.showBloodEffect(x, y);
            this.showPieceDeathAnimation(attackerPiece, attackingSquare);
            
            // Remove the attacking piece
            setTimeout(() => {
                this.board[fromRow][fromCol] = null;
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                this.updateTurnIndicator();
                this.updateBoardPerspective();
                this.renderBoard();
            }, 2000);
            
            return true;
        }
        
        this.captureMinigameActive = true;
        
        // Piece values for strength comparison
        const pieceValues = {
            'pawn': 1,
            'knight': 3,
            'bishop': 3,
            'rook': 5,
            'queen': 9,
            'king': 10
        };
        
        const attackerValue = pieceValues[attackingPiece.type];
        const defenderValue = pieceValues[defendingPiece.type];
        
        // Calculate health based on piece type and strength
        let defenderMaxHealth = 2; // Base health
        
        // If defender is stronger, they get double health
        if (defenderValue > attackerValue) {
            defenderMaxHealth = 4;
        }
        
        // If defender is a queen, they get triple health
        if (defendingPiece.type === 'queen') {
            defenderMaxHealth = 6;
        }
        
        // Initialize battle data
        this.captureMinigameData = {
            fromRow,
            fromCol,
            toRow,
            toCol,
            attackingPiece,
            defendingPiece,
            attackerColor: attackingPiece.color,
            defenderColor: defendingPiece.color,
            attackerValue,
            defenderValue,
            defenderMaxHealth,
            defenderHealth: defenderMaxHealth,
            attackReady: true,
            blockReady: false,
            blockCooldown: false,
            timeLeft: 10, // Changed to 10 seconds
            interval: null,
            attackerPosition: 50,
            defenderPosition: 50,
            defenderIsBlocking: false,
            gameOver: false,
            winner: null
        };
        
        // Show minigame UI
        const minigame = this.minigameElement;
        minigame.classList.add('active');
        
        // Add combat effects container
        if (!minigame.querySelector('.combat-effect')) {
            const combatEffect = document.createElement('div');
            combatEffect.className = 'combat-effect';
            minigame.querySelector('.battle-area').appendChild(combatEffect);
        }
        
        // Add victory effect container
        if (!minigame.querySelector('.victory-effect')) {
            const victoryEffect = document.createElement('div');
            victoryEffect.className = 'victory-effect';
            minigame.querySelector('.battle-area').appendChild(victoryEffect);
        }

        // Set up timer animation
        const timer = minigame.querySelector('.minigame-timer');
        timer.textContent = this.captureMinigameData.timeLeft;
        timer.style.setProperty('--progress', '0%');
        
        // Update health counter (replacing block counter)
        if (minigame.querySelector('.block-counter')) {
            const healthCounter = minigame.querySelector('.block-counter');
            healthCounter.className = 'health-counter';
            healthCounter.innerHTML = `Health: <span>${defenderMaxHealth}</span>/${defenderMaxHealth}`;
        } else {
            // Create health counter
            const healthCounter = document.createElement('div');
            healthCounter.className = 'health-counter';
            healthCounter.innerHTML = `Health: <span>${defenderMaxHealth}</span>/${defenderMaxHealth}`;
            minigame.appendChild(healthCounter);
        }
        
        // Update battle pieces appearance
        const attackerElement = minigame.querySelector('.battle-piece.attacker');
        const defenderElement = minigame.querySelector('.battle-piece.defender');
        
        // Set symbols for pieces
        attackerElement.querySelector('.piece-symbol').textContent = attackingPiece.symbol;
        defenderElement.querySelector('.piece-symbol').textContent = defendingPiece.symbol;
        
        // Set colors for pieces
        attackerElement.classList.remove('white', 'black');
        defenderElement.classList.remove('white', 'black');
        attackerElement.classList.add(attackingPiece.color);
        defenderElement.classList.add(defendingPiece.color);
        
        // Create or update health bar
        if (!minigame.querySelector('.health-bar-container')) {
            const healthBarContainer = document.createElement('div');
            healthBarContainer.className = 'health-bar-container';
            
            const healthBar = document.createElement('div');
            healthBar.className = 'health-bar';
            healthBar.style.width = '100%';
            
            healthBarContainer.appendChild(healthBar);
            minigame.appendChild(healthBarContainer);
        } else {
            const healthBar = minigame.querySelector('.health-bar');
            healthBar.style.width = '100%';
        }
        
        // Create cooldown indicator
        if (!minigame.querySelector('.cooldown-indicator')) {
            const cooldownIndicator = document.createElement('div');
            cooldownIndicator.className = 'cooldown-indicator';
            const cooldownProgress = document.createElement('div');
            cooldownProgress.className = 'cooldown-progress';
            cooldownIndicator.appendChild(cooldownProgress);
            minigame.appendChild(cooldownIndicator);
        }
        
        // Clear feedback
        minigame.querySelector('.combat-feedback').textContent = '';
        
        // Show strength comparison
        const attackerStrength = attackerValue;
        const defenderStrength = defenderValue;
        const strengthComparison = document.createElement('div');
        strengthComparison.className = 'strength-comparison';
        
        let comparisonText;
        if (attackerStrength > defenderStrength) {
            comparisonText = `ATTACKER ADVANTAGE! (${attackerStrength} vs ${defenderStrength})`;
        } else if (defenderStrength > attackerStrength) {
            comparisonText = `DEFENDER ADVANTAGE! (${defenderStrength} vs ${attackerStrength})`;
        } else {
            comparisonText = `EVEN MATCH! (${attackerStrength} vs ${defenderStrength})`;
        }
        
        strengthComparison.textContent = comparisonText;
        minigame.appendChild(strengthComparison);
        
        // Add instructions for the minigame
        const instructions = document.createElement('div');
        instructions.className = 'combat-instructions';
        instructions.innerHTML = `
            <p>BATTLE STARTED!</p>
            <p>Attacker (${attackingPiece.color.toUpperCase()}): Press W to attack!</p>
            <p>Defender (${defendingPiece.color.toUpperCase()}): Press B to block! (0.5s cooldown)</p>
            <p>${attackerStrength > defenderStrength ? "Strong attacker needs only 1 hit!" : "Attacker needs 2 hits to win!"}</p>
        `;
        minigame.appendChild(instructions);
        
        // Set up keyboard event listeners
        document.addEventListener('keydown', this.handleBattleKeydown);
        
        // Start countdown
        this.captureMinigameData.interval = setInterval(() => {
            this.captureMinigameData.timeLeft--;
            timer.textContent = this.captureMinigameData.timeLeft;
            
            if (this.captureMinigameData.timeLeft <= 0) {
                this.endCaptureMinigame(true); // Timeout means attacker wins
            }
        }, 1000);
        
        return true;
    }

    handleBattleKeydown = (e) => {
        if (!this.captureMinigameActive) return;
        
        const key = e.key.toLowerCase();
        const { 
            attackReady, blockReady, blockCooldown, attackerColor, defenderColor, 
            gameOver, attackerValue, defenderValue, defenderMaxHealth, defenderHealth 
        } = this.captureMinigameData;
        
        const minigame = this.minigameElement;
        const combatEffect = minigame.querySelector('.combat-effect');
        const attackerElement = minigame.querySelector('.battle-piece.attacker');
        const defenderElement = minigame.querySelector('.battle-piece.defender');
        
        // Handle sword attack (W key)
        if (key === 'w' && attackReady) {
            // Attacker can initiate an attack
            this.captureMinigameData.attackReady = false;
            this.captureMinigameData.blockReady = true;
            
            // Show attack animation
            attackerElement.classList.add('attacking');
            attackerElement.querySelector('.weapon').classList.add('active');
            
            // Show attack effect
            combatEffect.className = 'combat-effect attack';
            
            // Set a timeout to reset if defender doesn't block
            this.blockTimeout = setTimeout(() => {
                // If this timeout executes, it means defender didn't block in time
                
                // Determine damage based on attacker strength
                let damage = attackerValue > defenderValue ? defenderMaxHealth : 1;
                this.captureMinigameData.defenderHealth -= damage;
                
                // Show hit effect
                defenderElement.classList.add('hit');
                combatEffect.className = 'combat-effect hit';
                
                // Update health display
                const healthDisplay = minigame.querySelector('.health-counter span');
                healthDisplay.textContent = Math.max(0, this.captureMinigameData.defenderHealth);
                
                // Update health bar
                const healthBar = minigame.querySelector('.health-bar');
                const healthPercentage = (this.captureMinigameData.defenderHealth / defenderMaxHealth) * 100;
                healthBar.style.width = `${Math.max(0, healthPercentage)}%`;
                
                // Add blood particles on hit
                this.showBloodParticles(defenderElement);
                
                setTimeout(() => {
                    // Reset for next attack
                    attackerElement.classList.remove('attacking');
                    attackerElement.querySelector('.weapon').classList.remove('active');
                    defenderElement.classList.remove('hit');
                    this.captureMinigameData.attackReady = true;
                    this.captureMinigameData.blockReady = false;
                    
                    // Check if defender has lost
                    if (this.captureMinigameData.defenderHealth <= 0) {
                        this.endCaptureMinigame(true); // Attacker wins
                    }
                }, 400); // Shorter reset time for faster pace
            }, 100); // Changed to 100ms for even faster attack
        }
        
        // Handle shield block (B key)
        else if (key === 'b' && blockReady && !blockCooldown) {
            // Defender can block an incoming attack
            clearTimeout(this.blockTimeout); // Cancel the hit timeout
            
            // Activate block cooldown
            this.captureMinigameData.blockCooldown = true;
            
            // Show cooldown animation
            const cooldownIndicator = minigame.querySelector('.cooldown-indicator');
            const cooldownProgress = cooldownIndicator.querySelector('.cooldown-progress');
            cooldownIndicator.classList.add('active');
            cooldownProgress.style.transition = 'width 0.5s linear'; // Changed to 0.5s
            cooldownProgress.style.width = '0%';
            
            // Show block animation
            defenderElement.classList.add('blocking');
            defenderElement.querySelector('.weapon').classList.add('active');
            
            // Show block effect
            combatEffect.className = 'combat-effect block';
            
            // After animation ends, reset cooldown
            setTimeout(() => {
                this.captureMinigameData.blockCooldown = false;
                cooldownIndicator.classList.remove('active');
                cooldownProgress.style.transition = 'none';
                cooldownProgress.style.width = '100%';
            }, 500); // Changed to 0.5s
            
            // Reset for next round
            setTimeout(() => {
                attackerElement.classList.remove('attacking');
                attackerElement.querySelector('.weapon').classList.remove('active');
                defenderElement.classList.remove('blocking');
                defenderElement.querySelector('.weapon').classList.remove('active');
                
                this.captureMinigameData.attackReady = true;
                this.captureMinigameData.blockReady = false;
            }, 400); // Shorter reset time for faster pace
        }
        
        // If block is on cooldown, flash the cooldown indicator
        else if (key === 'b' && blockReady && blockCooldown) {
            const cooldownIndicator = document.querySelector('.cooldown-indicator');
            cooldownIndicator.style.animation = 'shake 0.5s';
            setTimeout(() => {
                cooldownIndicator.style.animation = '';
            }, 500);
        }

        // Defender controls
        if (!gameOver) {
            switch (key) {
                case "ArrowLeft":
                    if (this.captureMinigameData.defenderPosition > 10) {
                        this.captureMinigameData.defenderPosition -= 5;
                        this.updateBattlePositions();
                    }
                    break;
                case "ArrowRight":
                    if (this.captureMinigameData.defenderPosition < 90) {
                        this.captureMinigameData.defenderPosition += 5;
                        this.updateBattlePositions();
                    }
                    break;
                case "ArrowDown":
                    // Check if block is on cooldown
                    if (blockCooldown) {
                        // Shake the cooldown indicator to draw attention
                        const cooldownIndicator = document.querySelector('.cooldown-indicator');
                        cooldownIndicator.style.animation = 'shake 0.5s';
                        setTimeout(() => {
                            cooldownIndicator.style.animation = '';
                        }, 500);
                        
                        return;
                    }
                    
                    this.captureMinigameData.defenderIsBlocking = true;
                    this.updateBattlePositions();
                    
                    // Set cooldown
                    this.captureMinigameData.blockCooldown = true;
                    
                    // Show and animate cooldown indicator
                    const cooldownIndicator = document.querySelector('.cooldown-indicator');
                    const cooldownProgress = cooldownIndicator.querySelector('.cooldown-progress');
                    
                    cooldownIndicator.classList.add('active');
                    cooldownProgress.style.width = '100%';
                    
                    // Animate the cooldown
                    setTimeout(() => {
                        cooldownProgress.style.width = '0%';
                    }, 50); // Small delay to ensure transition works
                    
                    // Reset cooldown after 0.5 seconds
                    setTimeout(() => {
                        this.captureMinigameData.blockCooldown = false;
                        cooldownIndicator.classList.remove('active');
                        
                        // Flash the cooldown indicator green to signal availability
                        cooldownProgress.style.backgroundColor = '#4CAF50';
                        cooldownProgress.style.width = '100%';
                        
                        setTimeout(() => {
                            cooldownProgress.style.backgroundColor = '';
                            cooldownProgress.style.width = '0%';
                        }, 500);
                        
                    }, 500); // Changed to 0.5s
                    
                    // Auto-release block after 0.5 second
                    setTimeout(() => {
                        this.captureMinigameData.defenderIsBlocking = false;
                        this.updateBattlePositions();
                    }, 500);
                    break;
            }
        }
    }

    showBloodParticles(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create blood container if it doesn't exist
        if (!document.querySelector('.blood-particles')) {
            const bloodContainer = document.createElement('div');
            bloodContainer.className = 'blood-particles';
            document.body.appendChild(bloodContainer);
        }
        
        const bloodContainer = document.querySelector('.blood-particles');
        
        // Create blood particles
        const particleCount = 20 + Math.floor(Math.random() * 15);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'blood-particle';
            
            // Random size
            const size = 2 + Math.random() * 6;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random position around target
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            particle.style.left = `${centerX + offsetX}px`;
            particle.style.top = `${centerY + offsetY}px`;
            
            // Random velocity
            const speedX = -3 + Math.random() * 6;
            const speedY = 5 + Math.random() * 10; // Mostly downward
            
            // Animation
            particle.style.animation = `bloodDrop ${0.5 + Math.random() * 1.5}s forwards`;
            particle.style.setProperty('--speedX', `${speedX}px`);
            particle.style.setProperty('--speedY', `${speedY}px`);
            
            // Add to container
            bloodContainer.appendChild(particle);
            
            // Remove after animation completes
            setTimeout(() => {
                particle.remove();
            }, 2000);
        }
    }
    
    showPieceDeathAnimation(pieceElement, targetSquare) {
        // Clone the piece for death animation
        const pieceClone = pieceElement.cloneNode(true);
        const rect = pieceElement.getBoundingClientRect();
        
        // Create death container
        const deathContainer = document.createElement('div');
        deathContainer.className = 'death-animation';
        deathContainer.style.position = 'absolute';
        deathContainer.style.top = rect.top + 'px';
        deathContainer.style.left = rect.left + 'px';
        deathContainer.style.width = rect.width + 'px';
        deathContainer.style.height = rect.height + 'px';
        deathContainer.style.zIndex = '1000';
        
        // Add the dying piece
        pieceClone.className += ' dying';
        deathContainer.appendChild(pieceClone);
        
        // Add death fragments
        const fragmentCount = 20;
        const symbols = ['✧', '✦', '*', '✴', '✳', '❈', pieceElement.textContent];
        
        for (let i = 0; i < fragmentCount; i++) {
            const fragment = document.createElement('div');
            fragment.className = 'piece-fragment';
            
            // Random appearance
            fragment.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            fragment.style.fontSize = (10 + Math.random() * 20) + 'px';
            fragment.style.color = pieceElement.style.color || (pieceElement.classList.contains('white') ? '#ffffff' : '#444444');
            
            // Random position and animation
            const distance = -50 + Math.random() * 100;
            const duration = 0.8 + Math.random() * 1.2;
            const delay = Math.random() * 0.3;
            
            fragment.style.animation = `fragment-fly ${duration}s ease-out ${delay}s forwards`;
            fragment.style.setProperty('--distance', distance + 'px');
            
            deathContainer.appendChild(fragment);
        }
        
        // Add blood particles
        this.showBloodParticles(pieceElement);
        
        // Add scream text
        const scream = document.createElement('div');
        scream.className = 'death-scream';
        scream.textContent = 'AAAAHHHHHH!';
        deathContainer.appendChild(scream);
        
        // Hide original piece
        pieceElement.style.opacity = '0';
        
        // Add to document
        document.body.appendChild(deathContainer);
        
        // Remove after animation completes
        setTimeout(() => {
            deathContainer.remove();
        }, 2000);
    }

    endCaptureMinigame(attackerWins) {
        if (!this.captureMinigameActive) return;
        
        // Clear interval and timeouts
        clearInterval(this.captureMinigameData.interval);
        clearTimeout(this.blockTimeout);
        
        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleBattleKeydown);
        
        // Get battle data
        const { attackerColor, defenderColor, fromRow, fromCol, toRow, toCol } = this.captureMinigameData;
        
        // Show victory effect
        const victoryEffect = this.minigameElement.querySelector('.victory-effect');
        victoryEffect.classList.add('active');
        
        // Show death animation and complete move based on who won
        const targetSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
        const attackingSquare = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
        
        if (attackerWins) {
            // Attacker wins - defender dies
            const capturedPiece = targetSquare.querySelector('.piece');
            const rect = targetSquare.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Show blood effect and death animation
            this.showBloodEffect(x, y);
            this.showPieceDeathAnimation(capturedPiece, targetSquare);
            
            // Delay the move completion to allow for death animation
            setTimeout(() => {
                this.completeCaptureMove(fromRow, fromCol, toRow, toCol);
            }, 2000);
        } else {
            // Defender wins - attacker dies
            const attackerPiece = attackingSquare.querySelector('.piece');
            const rect = attackingSquare.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Show blood effect and death animation
            this.showBloodEffect(x, y);
            this.showPieceDeathAnimation(attackerPiece, attackingSquare);
            
            // Delay the board update to allow for death animation
            setTimeout(() => {
                // Remove the attacker piece
                this.board[fromRow][fromCol] = null;
                
                // Hide minigame UI
                this.minigameElement.classList.remove('active');
                this.captureMinigameActive = false;
                this.captureMinigameData = null;
                
                // Update turn and board
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                this.updateTurnIndicator();
                this.updateBoardPerspective();
                this.renderBoard();
            }, 2000);
        }
    }

    completeCaptureMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        
        // Store the last move
        this.lastMove = {
            fromRow,
            fromCol,
            toRow,
            toCol,
            piece: piece
        };
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        if (piece.type === 'pawn' || piece.type === 'king' || piece.type === 'rook') {
            piece.hasMoved = true;
        }

        // Show capture completion message
        this.minigameElement.querySelector('.minigame-instructions').textContent = "Capture successful!";
        
        // Hide minigame UI after delay
        setTimeout(() => {
            this.minigameElement.classList.remove('active');
            this.captureMinigameActive = false;
            this.captureMinigameData = null;
            
            // Update turn and board
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            this.updateTurnIndicator();
            this.updateBoardPerspective();
            this.renderBoard();
        }, 1500);
    }

    updateBattlePositions() {
        const minigame = this.minigameElement;
        const attackerElement = minigame.querySelector('.battle-piece.attacker');
        const defenderElement = minigame.querySelector('.battle-piece.defender');
        
        const attackerPosition = this.captureMinigameData.attackerPosition;
        const defenderPosition = this.captureMinigameData.defenderPosition;
        
        attackerElement.style.left = `${attackerPosition}%`;
        defenderElement.style.left = `${defenderPosition}%`;
    }
}

// Initialize the game
const game = new ChessGame();

function highlightLastMove(fromSquare, toSquare) {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => square.classList.remove('last-move'));
    fromSquare.classList.add('last-move');
    toSquare.classList.add('last-move');
}

function movePiece(fromSquare, toSquare) {
    const piece = fromSquare.querySelector('.piece');
    if (piece) {
        toSquare.appendChild(piece);
        highlightLastMove(fromSquare, toSquare);
        // ... existing code ...
    }
} 