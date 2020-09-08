#!/usr/bin/env python3
import math
import os

import numpy as np
from svgwrite import Drawing

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = 'assets'

def add_arrow(dwg, tail, head, head_angle, head_length, draw_tail=True, **kwargs):
  head = np.asarray(head, dtype=float)
  tail = np.asarray(tail, dtype=float)
  if draw_tail:
    dwg.add(dwg.line(start=tail, end=head, **kwargs))
  d = tail - head
  theta = math.atan2(d[1], d[0])
  for dt in (-1, 1):
    phi = theta + head_angle * dt
    end = head + np.array([math.cos(phi), math.sin(phi)]) * head_length
    dwg.add(dwg.line(start=head, end=end, **kwargs))

class SvgObject:
  def save(self, filename):
    path = os.path.join(ROOT, ASSETS, filename)
    self.render().saveas(path)

class CanvasType(SvgObject):
  def __init__(self, w=1, h=1):
    self.w = w
    self.h = h
  def render(self):
    viewbox = ' '.join(map(str, (-self.w, -self.h, 2*self.w, 2*self.h)))
    dwg = Drawing(viewBox=viewbox)
    return dwg

class CellBorderType(CanvasType):
  ROUNDED = 0.5
  FILL = 'white'
  STROKE = 'black'
  STROKE_WIDTH = 0.1
  def render(self):
    dwg = super().render()
    dwg.add(dwg.rect(
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
      dwg.add(dwg.circle(
        center=center,
        r=self.R1,
        fill=self.color1,
        stroke=self.STROKE,
        stroke_width=self.STROKE_WIDTH,
      ))
    for center in self.CENTERS0:
      dwg.add(dwg.circle(
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
    'stroke_width': 0.2,
    'stroke_linecap': 'round',
  }
  def render(self):
    dwg = super().render()
    add_arrow(dwg, (0, 0), self.head, stroke=self.BOT_COLOR, draw_tail=self.DRAW_TAIL, **self.ARROW_KWARGS)
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
  STROKE_WIDTH = 0.1
  TEXT_KWARGS = {
    'dominant_baseline': 'central',
    'text_anchor': 'middle',
    'lengthAdjust': 'spacingAndGlyphs',
    'fill': 'white',
    'font_family': 'Verdana, Symbola',
  }
  FONT_SIZE = 0.23
  TEXT_HEIGHT = 0.23
  def render(self):
    dwg = super().render()
    dwg.add(dwg.circle(
      center=(0,0),
      r=self.RADIUS,
      fill=self.BOT_COLOR,
      stroke=self.STROKE,
      stroke_width=self.STROKE_WIDTH,
    ))
    if self.TEXT is not None:
      texts = self.TEXT if isinstance(self.TEXT, list) else [self.TEXT]
      for i, text in enumerate(texts):
        y = (i - (len(texts) - 1) / 2.) * self.TEXT_HEIGHT
        dwg.add(dwg.text(
          text,
          insert=(0, y),
          font_size=self.FONT_SIZE,
          **self.TEXT_KWARGS,
        ))
    return dwg
class UnicodeOperationType(OperationType):
  FONT_SIZE = 0.8

class StartType(OperationType):
  TEXT = 'START'
class NextType(OperationType):
  TEXT = 'NEXT'
class GrabType(OperationType):
  TEXT = 'GRAB'
class DropType(OperationType):
  TEXT = 'DROP'
class SwapType(OperationType):
  TEXT = ['GRAB /', 'DROP']
class LatchType(OperationType):
  TEXT = 'LATCH'
class UnlatchType(OperationType):
  TEXT = 'UNLATCH'
class ToggleLatchType(OperationType):
  TEXT = ['LATCH /', 'UNLATCH']
class RelatchType(OperationType):
  TEXT = 'RELATCH'
class DropType(OperationType):
  TEXT = 'DROP'
class SyncType(UnicodeOperationType):
  TEXT = '🗘'
class RotateType(UnicodeOperationType):
  TEXT = '⭮'
class Power0Type(OperationType):
  TEXT = ['POWER', 'ℵ']
class Power1Type(OperationType):
  TEXT = ['POWER', 'ב']

class BranchDirectionType(DirectionType):
  HEAD_DISTANCE = 0.8
  DRAW_TAIL = True
# important that OperationType is before BranchDirectionType in MRO
class BranchType(OperationType, BranchDirectionType):
  TEXT = None
  BRANCH_RADIUS = 0.5
  def render(self):
    dwg = super().render()
    dwg.add(dwg.path(
      d=self.path,
      stroke='none',
      fill='white',
      opacity=0.5,
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
  os.makedirs(os.path.join(ROOT, ASSETS), exist_ok=True)

  BlueCell().save('fill_blue.svg')
  GreenCell().save('fill_green.svg')
  XCell().save('fill_x.svg')
  RedCell().save('fill_red.svg')
  OrangeCell().save('fill_orange.svg')
  PlusCell().save('fill_plus.svg')

  CellBorder().save('outline_unlatched.svg')
  LatchedCellBorder().save('outline_latched.svg')
  HorizontalOffsetCellBorder().save('outline_horizontal.svg')
  VerticalOffsetCellBorder().save('outline_vertical.svg')

  DiodeUp().save('outline_diode_up.svg')
  DiodeDown().save('outline_diode_down.svg')
  DiodeLeft().save('outline_diode_left.svg')
  DiodeRight().save('outline_diode_right.svg')

  RedDirectionUp().save('direction_red_up.svg')
  RedDirectionDown().save('direction_red_down.svg')
  RedDirectionLeft().save('direction_red_left.svg')
  RedDirectionRight().save('direction_red_right.svg')
  BlueDirectionUp().save('direction_blue_up.svg')
  BlueDirectionDown().save('direction_blue_down.svg')
  BlueDirectionLeft().save('direction_blue_left.svg')
  BlueDirectionRight().save('direction_blue_right.svg')

  RedStart().save('operation_red_start.svg')
  BlueStart().save('operation_blue_start.svg')
  RedNext().save('operation_red_next.svg')
  BlueNext().save('operation_blue_next.svg')
  RedGrab().save('operation_red_grab.svg')
  BlueGrab().save('operation_blue_grab.svg')
  RedDrop().save('operation_red_drop.svg')
  BlueDrop().save('operation_blue_drop.svg')
  RedSwap().save('operation_red_swap.svg')
  BlueSwap().save('operation_blue_swap.svg')
  RedLatch().save('operation_red_latch.svg')
  BlueLatch().save('operation_blue_latch.svg')
  RedUnlatch().save('operation_red_unlatch.svg')
  BlueUnlatch().save('operation_blue_unlatch.svg')
  RedToggleLatch().save('operation_red_togglelatch.svg')
  BlueToggleLatch().save('operation_blue_togglelatch.svg')
  RedRelatch().save('operation_red_relatch.svg')
  BlueRelatch().save('operation_blue_relatch.svg')
  RedSync().save('operation_red_sync.svg')
  BlueSync().save('operation_blue_sync.svg')
  RedRotate().save('operation_red_rotate.svg')
  BlueRotate().save('operation_blue_rotate.svg')
  RedPower0().save('operation_red_power0.svg')
  BluePower0().save('operation_blue_power0.svg')
  RedPower1().save('operation_red_power1.svg')
  BluePower1().save('operation_blue_power1.svg')

  RedBranch1Up().save('operation_red_branch1up.svg')
  BlueBranch1Up().save('operation_blue_branch1up.svg')
  RedBranch1Down().save('operation_red_branch1down.svg')
  BlueBranch1Down().save('operation_blue_branch1down.svg')
  RedBranch1Left().save('operation_red_branch1left.svg')
  BlueBranch1Left().save('operation_blue_branch1left.svg')
  RedBranch1Right().save('operation_red_branch1right.svg')
  BlueBranch1Right().save('operation_blue_branch1right.svg')
  RedBranch0Up().save('operation_red_branch0up.svg')
  BlueBranch0Up().save('operation_blue_branch0up.svg')
  RedBranch0Down().save('operation_red_branch0down.svg')
  BlueBranch0Down().save('operation_blue_branch0down.svg')
  RedBranch0Left().save('operation_red_branch0left.svg')
  BlueBranch0Left().save('operation_blue_branch0left.svg')
  RedBranch0Right().save('operation_red_branch0right.svg')
  BlueBranch0Right().save('operation_blue_branch0right.svg')

if __name__ == '__main__':
  main()
