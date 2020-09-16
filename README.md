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

See the Google Drive design document for an overview of gameplay.

## Interface

There are 3 different ways to input symbols.
- Click the symbol you want and then click the square you want to place in.
- Drag and drop from the bottom.
- Hold the key corresponding to the symbol (`Q-O` for the top row, `A-L` for the bottom) and click a square.

Additionally, you can drag symbols around that are already on the board. Shift click to select multiple symbols at a time.

## Levels
#### not
Given a blue or green input, output the opposite color.
#### and
Given two inputs, output blue if they are both blue and green otherwise.
#### crossing
Given a red/orange input and a blue/green input, output the inputs crossing paths.
#### delay
Given one input, output the color of the previous input. Output blue as the first output.
#### switch
Given one input, switch the output between blue and red whenever the input is blue. The output should start as blue (unless the first input is blue).
#### xor
Given two inputs, output green if they are the same or blue if they are different.
#### rainbow
No inputs. Output red, orange, yellow, green, blue, and purple in order and repeat.
#### median filter
Given one sequential input, output the median (majority) of the past 3 inputs. The first 3 inputs will be blue.
#### adder
Given two sequential inputs, let green represent a 0 bit and blue represent a 1 bit. The inputs are given from low bit to high bit. Output the corresponding color for the addition of these numbers in base 2.
#### stack
Given two sequential inputs, push the upper color onto a stack if the lower color is green, and pop from the stack to the output if the lower color is blue. When pushing onto the stack, output the color pushed. The inputs are guaranteed such that the stack never grows beyond 3 elements.

## Appendix
The interface has been implemented with icons, but the left hand sidebar can be used to load/copy a text submission (for testing).

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
