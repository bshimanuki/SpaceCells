#!/usr/bin/env python3
import math
import os

import numpy as np
from svgwrite import Drawing

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = 'assets'

def add_arrow(dwg, center, head, head_angle, head_length, tail=True, **kwargs):
  center = np.asarray(center)
  head = np.asarray(head)
  tail_end = 2 * center - head
  if tail:
    dwg.add(dwg.line(start=tail_end, end=head, **kwargs))
  d = center - head
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
  def __init__(self, w, h):
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
  OFFSET = 0.5
  R1 = 0.25 # blue
  R0 = 0.28 # green
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
  OFFSET = 0.6
  R1 = 0.33 # red
  R0 = 0.30 # orange
  @property
  def CENTERS1(self):
    return (
      (0, self.OFFSET),
      (0, -self.OFFSET),
    )
  @property
  def CENTERS0(self):
    return (
      (self.OFFSET, 0),
      (-self.OFFSET, 0),
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
    super().__init__(color1='orange')
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
    add_arrow(dwg, (0, 0), (0, -self.HEAD_DISTANCE), **self.ARROW_KWARGS)
    return dwg
class DiodeDown(VerticalOffsetCellBorder, Diode):
  def render(self):
    dwg = super().render()
    add_arrow(dwg, (0, 0), (0, self.HEAD_DISTANCE), **self.ARROW_KWARGS)
    return dwg
class DiodeLeft(HorizontalOffsetCellBorder, Diode):
  def render(self):
    dwg = super().render()
    add_arrow(dwg, (0, 0), (-self.HEAD_DISTANCE, 0), **self.ARROW_KWARGS)
    return dwg
class DiodeRight(HorizontalOffsetCellBorder, Diode):
  def render(self):
    dwg = super().render()
    add_arrow(dwg, (0, 0), (self.HEAD_DISTANCE, 0), **self.ARROW_KWARGS)
    return dwg

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

if __name__ == '__main__':
  main()
