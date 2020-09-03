# SpaceCells

## Access Instructions
```
git clone https://gitlab.com/teammate/70-auto-puzzle-spoilers
cd 70-auto-puzzle-spoilers
git checkout packaged-binaries
python3 -m http.server 8000
```
Open a browser and go to `localhost:8000/site/test.html`.

If you don't have python 3, you can run `python -m SimpleHTTPServer 8000` instead.

## Levels
#### not
Given a blue or green input, output the other color.
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

## Notes
See the Google Drive document for an overview.

Currently, everything is rendered with text (no sprites yet). The left hand sidebar can be used to load/copy a submission (for testing).

In the text format, each square is being displayed with up to 6 symbols. It looks like this.

<table>
<tr><td>cell</td><td>direction for red</td><td>direction for blue</td>
<tr><td>resolved cell polarity</td><td>operation for red</td><td>operation for blue</td>
</table>

All of these except the resolved cell polarity are inserted by the solver (or else are empty).

Here is a list of what each symbol corresponds to:
### Cells
- `x`: unlatched `x` cell
- `+`: unlatched `+` cell
- `/`: latched `x` cell in `/` polarity (blue orientation)
- `\`: latched `x` cell in `\` polarity (green orientation)
- `-`: latched `+` cell in `-` polarity (red orientation)
- `|`: latched `+` cell in `|` polarity (orange orientation)
- `][`: offset 1x2 `x` cell
- `WM`: offset 2x1 `x` cell
- `<x`: 2x1 diode cell going left
- `^x`: 1x2 diode cell going up
- `x>`: 1x2 diode cell going right
- `xv`: 1x2 diode cell going down
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
- `l`: LATCH
- `u`: UNLATCH
- `t`: TOGGLE LATCH
- `*`: REFRESH
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
