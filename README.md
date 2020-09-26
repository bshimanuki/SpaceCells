# SpaceCells

## Access Instructions
```
git clone https://gitlab.com/teammate/70-auto-puzzle-spoilers
cd 70-auto-puzzle-spoilers
git checkout packaged-binaries
python3 -m http.server 8000
```
Open a browser and go to `localhost:8000/build`.

If you don't have python 3, you can run `python -m SimpleHTTPServer 8000` instead.

## Interface

There are 3 different ways to input symbols.
- Click the symbol you want and then click the square you want to place in.
- Drag and drop from the bottom.
- Hold the key corresponding to the symbol (`Q-O` for the top row, `A-L` for the bottom) and click a square.

Additionally, you can drag symbols around that are already on the board. Shift click to select multiple symbols at a time. Click hold an empty part of the grid and move the cursor to select a rectangle area. This also works with shift click hold.

## Levels
#### not
Given a blue or green input, output the opposite color.
#### crossing
Given a red/orange input and a blue/green input, output the inputs crossing paths.
#### and
Given two inputs, output blue if they are both blue and green otherwise.
#### delay
Given one input, output the color of the previous input. Output blue as the first output.
#### switch
Given one input, switch the output between blue and red whenever the input is blue. The output should start as blue (unless the first input is blue).
#### xor
Given two inputs, output green if they are the same or blue if they are different.
#### ram
You have a blue/green input and a red/orange input. You should output the color of the top input the previous time the bottom input was that color. The first time red is input and the first time orange is input, you should output blue.
#### rainbow
No inputs. Output red, orange, yellow, green, blue, and purple in order and repeat.
#### median filter
Given one sequential input, output the median (majority) of the past 3 inputs. The first 3 inputs will be blue.
#### adder
Given two sequential inputs, let green represent a 0 bit and blue represent a 1 bit. The inputs are given from low bit to high bit. Output the corresponding color for the addition of these numbers in base 2.
#### battle
Simulate the status of a game with a blue player using the top input and a green player using the bottom input. The game starts neutral (white). A player fires their gun by inputting red. If exactly one player fires, the state moves one step in the direction of that player (green, white, blue) or stays the same if already the color of that player. If neither fires, nothing happens. If both players fire, they both lose and you should output purple and reset the state to neutral.
#### stack
Given two sequential inputs, push the upper color onto a stack if the lower color is green, and pop from the stack to the output if the lower color is blue. When pushing onto the stack, output the color pushed. The inputs are guaranteed such that the stack never grows beyond 3 elements.

## Appendix
The interface has been implemented with icons, but the Debug Window can be used to load/copy a text submission (for testing).

Here is a list of what each symbol corresponds to in the text format.
### Cells
- `x`: unlatched `x` cell
- `+`: unlatched `+` cell
- `/`: latched `x` cell in `/` polarity (blue orientation)
- `\`: latched `x` cell in `\` polarity (green orientation)
- `-`: latched `+` cell in `-` polarity (red orientation)
- `|`: latched `+` cell in `|` polarity (orange orientation)
- `][`: offset 1x2 `x` cell
- `WM`: offset 2x1 `x` cell
- `<x`: 1x2 diode cell going left
- `^x`: 2x1 diode cell going up
- `x>`: 1x2 diode cell going right
- `xv`: 2x1 diode cell going down
### Directions (Instructions)
- `<`: left
- `v`: down
- `>`: right
- `^`: up
### Operations (Instructions)
- `S`: START
- `n`: NEXT
- `g`: GRAB
- `d`: DROP
- `w`: GRAB/DROP
- `l`: LOCK
- `u`: FREE
- `t`: LOCK/FREE
- `*`: RESET
- `s`: SYNC
- `r`: ROTATE
- `<`: BRANCH left if cell is | or /
- `v`: BRANCH down if cell is | or /
- `>`: BRANCH right if cell is | or /
- `^`: BRANCH up if cell is | or /
- `[`: BRANCH left if cell is - or \
- `W`: BRANCH down if cell is - or \
- `]`: BRANCH right if cell is - or \
- `M`: BRANCH up if cell is - or \
- `p`: TOGGLE POWER 1 (upper output)
- `P`: TOGGLE POWER 2 (lower output)
