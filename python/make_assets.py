#!/usr/bin/env python3
import math
import os

import numpy as np
from svgwrite import Drawing

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_PATH = os.path.join(ROOT, 'site/assets')
ASSETS_JS = 'assets.js'

def add_arrow(dwg, tail, head, head_angle, head_length, draw_tail=True, **kwargs):
  head = np.asarray(head, dtype=float)
  tail = np.asarray(tail, dtype=float)
  if draw_tail:
    dwg.group.add(dwg.line(start=tail, end=head, **kwargs))
  d = tail - head
  theta = math.atan2(d[1], d[0])
  for dt in (-1, 1):
    phi = theta + head_angle * dt
    end = head + np.array([math.cos(phi), math.sin(phi)]) * head_length
    dwg.group.add(dwg.line(start=head, end=end, **kwargs))

class SvgObject:
  def save(self, filename):
    path = os.path.join(ASSETS_PATH, filename)
    self.render().saveas(path)

class CanvasType(SvgObject):
  def __init__(self, w=1, h=1):
    self.w = w
    self.h = h
  def render(self):
    viewbox = ' '.join(map(str, (-self.w, -self.h, 2*self.w, 2*self.h)))
    dwg = Drawing(viewBox=viewbox)
    dwg.group = dwg.g(class_="svg-element")
    dwg.add(dwg.group)
    return dwg

class CellBorderType(CanvasType):
  ROUNDED = 0.5
  FILL = 'white'
  STROKE = 'black'
  STROKE_WIDTH = 0.1
  def render(self):
    dwg = super().render()
    dwg.group.add(dwg.rect(
      insert=(-self.w+self.STROKE_WIDTH/2, -self.h+self.STROKE_WIDTH/2),
      size=(2*self.w-self.STROKE_WIDTH, 2*self.h-self.STROKE_WIDTH),
      rx=self.ROUNDED,
      ry=self.ROUNDED,
      fill=self.FILL,
      stroke=self.STROKE,
      stroke_width=self.STROKE_WIDTH,
    ))
    return dwg

class CellFillType(CanvasType):
  STROKE = 'gray'
  STROKE_WIDTH = 0.05
  def __init__(self, color1=None, color0=None):
    super().__init__(w=1, h=1)
    self.color1 = color1 or 'none'
    self.color0 = color0 or 'none'
  def render(self):
    dwg = super().render()
    for center in self.CENTERS1:
      dwg.group.add(dwg.circle(
        center=center,
        r=self.R1,
        fill=self.color1,
        stroke=self.STROKE,
        stroke_width=self.STROKE_WIDTH,
      ))
    for center in self.CENTERS0:
      dwg.group.add(dwg.circle(
        center=center,
        r=self.R0,
        fill=self.color0,
        stroke=self.STROKE,
        stroke_width=self.STROKE_WIDTH,
      ))
    return dwg

class XCellType(CellFillType):
  OFFSET = 0.35
  R1 = 0.20 # blue
  R0 = 0.22 # green
  @property
  def CENTERS1(self):
    return (
      (-self.OFFSET, self.OFFSET),
      (self.OFFSET, -self.OFFSET),
    )
  @property
  def CENTERS0(self):
    return (
      (-self.OFFSET, -self.OFFSET),
      (self.OFFSET, self.OFFSET),
    )

class PlusCellType(CellFillType):
  OFFSET = 0.5
  R1 = 0.27 # red
  R0 = 0.24 # orange
  @property
  def CENTERS1(self):
    return (
      (self.OFFSET, 0),
      (-self.OFFSET, 0),
    )
  @property
  def CENTERS0(self):
    return (
      (0, self.OFFSET),
      (0, -self.OFFSET),
    )

class BlueCell(XCellType):
  def __init__(self):
    super().__init__(color1='blue')
class GreenCell(XCellType):
  def __init__(self):
    super().__init__(color0='green')
class XCell(XCellType):
  def __init__(self):
    super().__init__(color1='lightgray', color0='lightgray')
class RedCell(PlusCellType):
  def __init__(self):
    super().__init__(color1='red')
class OrangeCell(PlusCellType):
  def __init__(self):
    super().__init__(color0='orange')
class PlusCell(PlusCellType):
  def __init__(self):
    super().__init__(color1='lightgray', color0='lightgray')

class CellBorder(CellBorderType):
  def __init__(self):
    super().__init__(w=1, h=1)
class LatchedCellBorder(CellBorderType):
  STROKE = 'goldenrod'
  def __init__(self):
    super().__init__(w=1, h=1)
class HorizontalOffsetCellBorder(CellBorderType):
  def __init__(self):
    super().__init__(w=2, h=1)
class VerticalOffsetCellBorder(CellBorderType):
  def __init__(self):
    super().__init__(w=1, h=2)

class Diode:
  HEAD_DISTANCE = 0.3
  ARROW_KWARGS = {
    'head_angle': math.pi / 4,
    'head_length': 0.3,
    'stroke': 'black',
    'stroke_width': 0.1,
    'stroke_linecap': 'round',
  }
class DiodeUp(VerticalOffsetCellBorder, Diode):
  def render(self):
    dwg = super().render()
    add_arrow(dwg, (0, self.HEAD_DISTANCE), (0, -self.HEAD_DISTANCE), **self.ARROW_KWARGS)
    return dwg
class DiodeDown(VerticalOffsetCellBorder, Diode):
  def render(self):
    dwg = super().render()
    add_arrow(dwg, (0, -self.HEAD_DISTANCE), (0, self.HEAD_DISTANCE), **self.ARROW_KWARGS)
    return dwg
class DiodeLeft(HorizontalOffsetCellBorder, Diode):
  def render(self):
    dwg = super().render()
    add_arrow(dwg, (self.HEAD_DISTANCE, 0), (-self.HEAD_DISTANCE, 0), **self.ARROW_KWARGS)
    return dwg
class DiodeRight(HorizontalOffsetCellBorder, Diode):
  def render(self):
    dwg = super().render()
    add_arrow(dwg, (-self.HEAD_DISTANCE, 0), (self.HEAD_DISTANCE, 0), **self.ARROW_KWARGS)
    return dwg

class RedBotType:
  BOT_COLOR = 'red'
class BlueBotType:
  BOT_COLOR = 'blue'

class DirectionType(CanvasType):
  HEAD_DISTANCE = 0.9
  DRAW_TAIL = False
  ARROW_KWARGS = {
    'head_angle': math.pi / 3,
    'head_length': 0.4,
    'stroke_linecap': 'round',
  }
  ARROWSTROKE_WIDTH = 0.2
  CLICKABLE_STROKE_WIDTH = 0.5
  def render(self):
    dwg = super().render()
    add_arrow(dwg, (0, 0), self.head, stroke='white', stroke_opacity=0, stroke_width=self.CLICKABLE_STROKE_WIDTH, draw_tail=self.DRAW_TAIL, **self.ARROW_KWARGS)
    add_arrow(dwg, (0, 0), self.head, stroke=self.BOT_COLOR, stroke_width=self.ARROWSTROKE_WIDTH, draw_tail=self.DRAW_TAIL, **self.ARROW_KWARGS)
    return dwg

class DirectionUpType(DirectionType):
  @property
  def head(self):
    return (0, -self.HEAD_DISTANCE)
class DirectionDownType(DirectionType):
  @property
  def head(self):
    return (0, self.HEAD_DISTANCE)
class DirectionLeftType(DirectionType):
  @property
  def head(self):
    return (-self.HEAD_DISTANCE, 0)
class DirectionRightType(DirectionType):
  @property
  def head(self):
    return (self.HEAD_DISTANCE, 0)

class RedDirectionUp(DirectionUpType, RedBotType):
  pass
class RedDirectionDown(DirectionDownType, RedBotType):
  pass
class RedDirectionLeft(DirectionLeftType, RedBotType):
  pass
class RedDirectionRight(DirectionRightType, RedBotType):
  pass
class BlueDirectionUp(DirectionUpType, BlueBotType):
  pass
class BlueDirectionDown(DirectionDownType, BlueBotType):
  pass
class BlueDirectionLeft(DirectionLeftType, BlueBotType):
  pass
class BlueDirectionRight(DirectionRightType, BlueBotType):
  pass

class OperationType(CanvasType):
  RADIUS = 0.6
  STROKE = 'gray'
  STROKE_WIDTH = 0.05
  TEXT_KWARGS = {
    'dominant_baseline': 'central',
    'text_anchor': 'middle',
    'lengthAdjust': 'spacingAndGlyphs',
    'fill': 'white',
    'font_family': 'Verdana, Symbola',
  }
  FONT_SIZE = 0.30
  TEXT_HEIGHT = 0.35
  UNICODE_FONT_SIZE = 0.5
  UNICODE_TEXT_HEIGHT = 0.45
  def render(self):
    dwg = super().render()
    dwg.group.add(dwg.circle(
      center=(0,0),
      r=self.RADIUS,
      fill=self.BOT_COLOR,
      stroke=self.STROKE,
      stroke_width=self.STROKE_WIDTH,
    ))
    if self.TEXT is not None:
      texts = self.TEXT if isinstance(self.TEXT, list) else [self.TEXT]
      for i, text in enumerate(texts):
        if text.isascii():
          font_size = self.FONT_SIZE
          text_height = self.TEXT_HEIGHT
        else:
          font_size = self.UNICODE_FONT_SIZE
          text_height = self.UNICODE_TEXT_HEIGHT
        y = (i - (len(texts) - 1) / 2.) * text_height
        dwg.group.add(dwg.text(
          text,
          insert=(0, y),
          font_size=font_size,
          **self.TEXT_KWARGS,
        ))
    return dwg
class UnicodeOperationType(OperationType):
  UNICODE_FONT_SIZE = 0.8

class StartType(OperationType):
  TEXT = 'START'
class NextType(OperationType):
  TEXT = 'NEXT'
class GrabType(OperationType):
  TEXT = 'GRAB'
class DropType(OperationType):
  TEXT = 'DROP'
class SwapType(OperationType):
  TEXT = ['GRAB', 'DROP']
class LatchType(OperationType):
  TEXT = 'LOCK'
class UnlatchType(OperationType):
  TEXT = 'FREE'
class ToggleLatchType(OperationType):
  TEXT = ['LOCK', 'FREE']
class RelatchType(OperationType):
  TEXT = 'RESET'
# class RelatchType(UnicodeOperationType):
  # TEXT = '💥'
class SyncType(UnicodeOperationType):
  TEXT = '🗘'
class RotateType(UnicodeOperationType):
  TEXT = '⭮'
class Power0Type(OperationType):
  TEXT = ['PWR', 'ℵ']
class Power1Type(OperationType):
  TEXT = ['PWR', 'ב']

class BranchDirectionType(DirectionType):
  HEAD_DISTANCE = 0.8
  DRAW_TAIL = True
# important that OperationType is before BranchDirectionType in MRO
class BranchType(OperationType, BranchDirectionType):
  TEXT = None
  BRANCH_RADIUS = 0.5
  def render(self):
    dwg = super().render()
    dwg.group.add(dwg.path(
      d=self.path,
      stroke='none',
      fill='white',
      opacity=0.75,
    ))
    return dwg
class Branch1Type(BranchType):
  @property
  def path(self):
    path = []
    path.append(['M', self.BRANCH_RADIUS, 0])
    path.append(['A', self.BRANCH_RADIUS, self.BRANCH_RADIUS, 0, 0, 0, self.BRANCH_RADIUS/math.sqrt(2), -self.BRANCH_RADIUS/math.sqrt(2)])
    path.append(['L', -self.BRANCH_RADIUS/math.sqrt(2), self.BRANCH_RADIUS/math.sqrt(2)])
    path.append(['A', self.BRANCH_RADIUS, self.BRANCH_RADIUS, 0, 0, 1, -self.BRANCH_RADIUS, 0])
    return ' '.join(' '.join(map(str, command)) for command in path)
class Branch0Type(BranchType):
  @property
  def path(self):
    path = []
    path.append(['M', 0, -self.BRANCH_RADIUS])
    path.append(['A', self.BRANCH_RADIUS, self.BRANCH_RADIUS, 0, 0, 0, -self.BRANCH_RADIUS/math.sqrt(2), -self.BRANCH_RADIUS/math.sqrt(2)])
    path.append(['L', self.BRANCH_RADIUS/math.sqrt(2), self.BRANCH_RADIUS/math.sqrt(2)])
    path.append(['A', self.BRANCH_RADIUS, self.BRANCH_RADIUS, 0, 0, 1, 0, self.BRANCH_RADIUS])
    return ' '.join(' '.join(map(str, command)) for command in path)

class RedStart(StartType, RedBotType):
  pass
class BlueStart(StartType, BlueBotType):
  pass
class RedNext(NextType, RedBotType):
  pass
class BlueNext(NextType, BlueBotType):
  pass
class RedGrab(GrabType, RedBotType):
  pass
class BlueGrab(GrabType, BlueBotType):
  pass
class RedDrop(DropType, RedBotType):
  pass
class BlueDrop(DropType, BlueBotType):
  pass
class RedSwap(SwapType, RedBotType):
  pass
class BlueSwap(SwapType, BlueBotType):
  pass
class RedLatch(LatchType, RedBotType):
  pass
class BlueLatch(LatchType, BlueBotType):
  pass
class RedUnlatch(UnlatchType, RedBotType):
  pass
class BlueUnlatch(UnlatchType, BlueBotType):
  pass
class RedToggleLatch(ToggleLatchType, RedBotType):
  pass
class BlueToggleLatch(ToggleLatchType, BlueBotType):
  pass
class RedRelatch(RelatchType, RedBotType):
  pass
class BlueRelatch(RelatchType, BlueBotType):
  pass
class RedSync(SyncType, RedBotType):
  pass
class BlueSync(SyncType, BlueBotType):
  pass
class RedRotate(RotateType, RedBotType):
  pass
class BlueRotate(RotateType, BlueBotType):
  pass
class RedPower0(Power0Type, RedBotType):
  pass
class BluePower0(Power0Type, BlueBotType):
  pass
class RedPower1(Power1Type, RedBotType):
  pass
class BluePower1(Power1Type, BlueBotType):
  pass

class RedBranch1Up(Branch1Type, DirectionUpType, RedBotType):
  pass
class BlueBranch1Up(Branch1Type, DirectionUpType, BlueBotType):
  pass
class RedBranch1Down(Branch1Type, DirectionDownType, RedBotType):
  pass
class BlueBranch1Down(Branch1Type, DirectionDownType, BlueBotType):
  pass
class RedBranch1Left(Branch1Type, DirectionLeftType, RedBotType):
  pass
class BlueBranch1Left(Branch1Type, DirectionLeftType, BlueBotType):
  pass
class RedBranch1Right(Branch1Type, DirectionRightType, RedBotType):
  pass
class BlueBranch1Right(Branch1Type, DirectionRightType, BlueBotType):
  pass
class RedBranch0Up(Branch0Type, DirectionUpType, RedBotType):
  pass
class BlueBranch0Up(Branch0Type, DirectionUpType, BlueBotType):
  pass
class RedBranch0Down(Branch0Type, DirectionDownType, RedBotType):
  pass
class BlueBranch0Down(Branch0Type, DirectionDownType, BlueBotType):
  pass
class RedBranch0Left(Branch0Type, DirectionLeftType, RedBotType):
  pass
class BlueBranch0Left(Branch0Type, DirectionLeftType, BlueBotType):
  pass
class RedBranch0Right(Branch0Type, DirectionRightType, RedBotType):
  pass
class BlueBranch0Right(Branch0Type, DirectionRightType, BlueBotType):
  pass

def main():
  os.makedirs(ASSETS_PATH, exist_ok=True)

  assets = {
    BlueCell: 'fill_blue.svg',
    GreenCell: 'fill_green.svg',
    XCell: 'fill_x.svg',
    RedCell: 'fill_red.svg',
    OrangeCell: 'fill_orange.svg',
    PlusCell: 'fill_plus.svg',

    CellBorder: 'outline_unlatched.svg',
    LatchedCellBorder: 'outline_latched.svg',
    HorizontalOffsetCellBorder: 'outline_horizontal.svg',
    VerticalOffsetCellBorder: 'outline_vertical.svg',

    DiodeUp: 'outline_diode_up.svg',
    DiodeDown: 'outline_diode_down.svg',
    DiodeLeft: 'outline_diode_left.svg',
    DiodeRight: 'outline_diode_right.svg',

    RedDirectionUp: 'direction_red_up.svg',
    RedDirectionDown: 'direction_red_down.svg',
    RedDirectionLeft: 'direction_red_left.svg',
    RedDirectionRight: 'direction_red_right.svg',
    BlueDirectionUp: 'direction_blue_up.svg',
    BlueDirectionDown: 'direction_blue_down.svg',
    BlueDirectionLeft: 'direction_blue_left.svg',
    BlueDirectionRight: 'direction_blue_right.svg',

    RedStart: 'operation_red_start.svg',
    BlueStart: 'operation_blue_start.svg',
    RedNext: 'operation_red_next.svg',
    BlueNext: 'operation_blue_next.svg',
    RedGrab: 'operation_red_grab.svg',
    BlueGrab: 'operation_blue_grab.svg',
    RedDrop: 'operation_red_drop.svg',
    BlueDrop: 'operation_blue_drop.svg',
    RedSwap: 'operation_red_swap.svg',
    BlueSwap: 'operation_blue_swap.svg',
    RedLatch: 'operation_red_latch.svg',
    BlueLatch: 'operation_blue_latch.svg',
    RedUnlatch: 'operation_red_unlatch.svg',
    BlueUnlatch: 'operation_blue_unlatch.svg',
    RedToggleLatch: 'operation_red_togglelatch.svg',
    BlueToggleLatch: 'operation_blue_togglelatch.svg',
    RedRelatch: 'operation_red_relatch.svg',
    BlueRelatch: 'operation_blue_relatch.svg',
    RedSync: 'operation_red_sync.svg',
    BlueSync: 'operation_blue_sync.svg',
    RedRotate: 'operation_red_rotate.svg',
    BlueRotate: 'operation_blue_rotate.svg',
    RedPower0: 'operation_red_power0.svg',
    BluePower0: 'operation_blue_power0.svg',
    RedPower1: 'operation_red_power1.svg',
    BluePower1: 'operation_blue_power1.svg',

    RedBranch1Up: 'operation_red_branch1up.svg',
    BlueBranch1Up: 'operation_blue_branch1up.svg',
    RedBranch1Down: 'operation_red_branch1down.svg',
    BlueBranch1Down: 'operation_blue_branch1down.svg',
    RedBranch1Left: 'operation_red_branch1left.svg',
    BlueBranch1Left: 'operation_blue_branch1left.svg',
    RedBranch1Right: 'operation_red_branch1right.svg',
    BlueBranch1Right: 'operation_blue_branch1right.svg',
    RedBranch0Up: 'operation_red_branch0up.svg',
    BlueBranch0Up: 'operation_blue_branch0up.svg',
    RedBranch0Down: 'operation_red_branch0down.svg',
    BlueBranch0Down: 'operation_blue_branch0down.svg',
    RedBranch0Left: 'operation_red_branch0left.svg',
    BlueBranch0Left: 'operation_blue_branch0left.svg',
    RedBranch0Right: 'operation_red_branch0right.svg',
    BlueBranch0Right: 'operation_blue_branch0right.svg',
  }

  lines = []
  for cls, fname in assets.items():
    cls().save(fname)
    root = os.path.splitext(fname)[0]
    lines.append("export {{ default as {} }} from './{}';".format(root, fname))
  with open(os.path.join(ASSETS_PATH, ASSETS_JS), 'wt') as js_file:
    js_file.write('\n'.join(lines))

if __name__ == '__main__':
  main()
