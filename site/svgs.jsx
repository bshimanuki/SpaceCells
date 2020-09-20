import React from "react";

import "./svgs.css";

// Cells are overlaid over grid squares without padding and we take care of padding here.
// This is necessary for sizing to be correct on cells spanning multiple squares.
const PADDING = 0.06;
const BOT_PADDING = 0.02;

function Svg({w, h, children, ...props}) {
  return <div {...props}>
    <svg viewBox={`${-w} ${-h} ${2*w} ${2*h}`}>{children}</svg>
  </div>;
}
Svg.defaultProps = {w:1, h:1};

function Arrow({x1, y1, x2, y2, headAngle, headLength, drawTail, padding, className, ...props}) {
  x1 *= 1 - padding;
  y1 *= 1 - padding;
  x2 *= 1 - padding;
  y2 *= 1 - padding;
  headLength *= 1 - padding;
  let theta = Math.atan2(y1 - y2, x1 - x2);
  return <g className={`arrow ${className}`}>
    {drawTail && <line className="arrow-tail" x1={x1} y1={y1} x2={x2} y2={y2} {...props}/>}
    {[-1, 1].map(dt => {
      let phi = theta + headAngle * dt;
      let x = x2 + Math.cos(phi) * headLength;
      let y = y2 + Math.sin(phi) * headLength;
      return <line key={dt} className="arrow-head" x1={x2} y1={y2} x2={x} y2={y} {...props}/>;
    })}
    </g>;
}
Arrow.defaultProps = {
  x1: 0,
  y1: 0,
  className: "",
  padding: PADDING,
};

function CellBorder({w, h, r, strokeWidth, className, padding, ...props}) {
  let x = -w + strokeWidth / 2 + 2 * padding;
  let y = -h + strokeWidth / 2 + 2 * padding;
  let width = 2 * w - strokeWidth - 4 * padding;
  let height = 2 * h - strokeWidth - 4 * padding;
  return <rect className={className} x={x} y={y} width={width} height={height} rx={r} ry={r}
    style={{strokeWidth:strokeWidth}} {...props}/>;
}
CellBorder.defaultProps = {
  r: 0.5,
  strokeWidth: 0.1,
  className: "cell-border",
  padding: PADDING,
};

export function CellBot({w, h, r, strokeWidth, padding, ...props}) {
  return <Svg w={w} h={h} {...props}>
    <CellBorder w={w} h={h} r={r} strokeWidth={strokeWidth} padding={padding} className="bot-outline bot-stroke"/>
  </Svg>;
}
CellBot.defaultProps = {
  w: 1,
  h: 1,
  r: CellBorder.defaultProps.r + CellBorder.defaultProps.strokeWidth / 2 + (PADDING - BOT_PADDING),
  strokeWidth: 2 * (PADDING - BOT_PADDING),
  padding: BOT_PADDING,
};


// x, y not padded
function XCellFill({x, y, offset, r1, r0, padding, ...props}) {
  offset *= 1 - padding;
  r1 *= 1 - padding;
  r0 *= 1 - padding;
  return <g className="cell-fill cell-x">
    <circle className="circle-1" cx={x-offset} cy={y+offset} r={r1} {...props}/>
    <circle className="circle-1" cx={x+offset} cy={y-offset} r={r1} {...props}/>
    <circle className="circle-0" cx={x-offset} cy={y-offset} r={r0} {...props}/>
    <circle className="circle-0" cx={x+offset} cy={y+offset} r={r0} {...props}/>
    </g>;
}
XCellFill.defaultProps = {
  x: 0,
  y: 0,
  offset: 0.35,
  r1: 0.20, // blue
  r0: 0.22, // green
  padding: PADDING,
};

function PlusCellFill({x, y, offset, r1, r0, padding, ...props}) {
  offset *= 1 - padding;
  r1 *= 1 - padding;
  r0 *= 1 - padding;
  return <g className="cell-fill cell-plus">
    <circle className="circle-1" cx={x-offset} cy={0} r={r1} {...props}/>
    <circle className="circle-1" cx={x+offset} cy={0} r={r1} {...props}/>
    <circle className="circle-0" cx={0} cy={x-offset} r={r0} {...props}/>
    <circle className="circle-0" cx={0} cy={x+offset} r={r0} {...props}/>
    </g>;
}
PlusCellFill.defaultProps = {
  x: 0,
  y: 0,
  offset: 0.5,
  r1: 0.27, // red
  r0: 0.24, // orange
  padding: PADDING,
};

export function XCell({w, h, _className, className, ...props}) {
  return <Svg w={w} h={h} className={`${_className} ${className}`} {...props}>
    <CellBorder w={w} h={h}/>
    <XCellFill/>
  </Svg>;
}
XCell.defaultProps = {w:1, h:1, _className:"cell-x", className:""};
export function PlusCell({w, h, _className, className, ...props}) {
  return <Svg w={w} h={h} className={`${_className} ${className}`} {...props}>
    <CellBorder w={w} h={h}/>
    <PlusCellFill/>
  </Svg>;
}
PlusCell.defaultProps = {w:1, h:1, _className:"cell-plus", className:""};
export function HorizontalCell(props) {
  return <XCell _className="cell-horizontal" w={2} {...props}/>;
}
export function VerticalCell(props) {
  return <XCell _className="cell-vertical" h={2} {...props}/>;
}

function Diode({dx, dy, headDistance, headLength, headAngle, className, ...props}) {
  let x = dx * headDistance;
  let y = dy * headDistance;
  let w = dx ? 2 : 1;
  let h = dy ? 2 : 1;
  return <Svg w={w} h={h} className={`diode ${className}`} {...props}>
    <CellBorder w={w} h={h}/>
    <Arrow x1={-x} y1={-y} x2={x} y2={y} headLength={headLength} headAngle={headAngle} drawTail/>;
    <XCellFill x={-dx} y={-dy}/>
    <XCellFill x={dx} y={dy}/>
  </Svg>;
}
Diode.defaultProps = {
  headDistance: 0.3,
  headLength: 0.3,
  headAngle: Math.PI / 4,
};

export function DiodeUp(props) {
  return <Diode dx={0} dy={-1} className="diode-up" {...props}/>;
}
export function DiodeDown(props) {
  return <Diode dx={0} dy={1} className="diode-down" {...props}/>;
}
export function DiodeLeft(props) {
  return <Diode dx={-1} dy={0} className="diode-left" {...props}/>;
}
export function DiodeRight(props) {
  return <Diode dx={1} dy={0} className="diode-right" {...props}/>;
}

function DirectionArrow({dx, dy, headDistance, drawGhost, className, ...props}) {
  let x = dx * headDistance;
  let y = dy * headDistance;
  return <>
    {drawGhost && <Arrow className="direction-ghost" x2={x} y2={y} {...props}/>}
    {drawGhost && <Arrow className="direction-outline" x2={x} y2={y} {...props}/>}
    <Arrow className={`direction-main bot-stroke ${className}`} x2={x} y2={y} {...props}/>
  </>;
}
DirectionArrow.defaultProps = {
  headDistance: 0.5,
  headAngle: Math.PI / 3,
  headLength: 0.4,
  drawGhost: true,
};

function Direction({dx, dy, _className, className, arrowProps, ...props}) {
  return <Svg className={`direction ${_className} ${className}`} {...props}>
    <DirectionArrow dx={dx} dy={dy} {...arrowProps}/>
  </Svg>;
}
Direction.defaultProps = {
  _className: "",
  className: "",
};

export function DirectionUp(props) {
  return <Direction dx={0} dy={-1} _className="direction-up" {...props}/>;
}
export function DirectionDown(props) {
  return <Direction dx={0} dy={1} _className="direction-down" {...props}/>;
}
export function DirectionLeft(props) {
  return <Direction dx={-1} dy={0} _className="direction-left" {...props}/>;
}
export function DirectionRight(props) {
  return <Direction dx={1} dy={0} _className="direction-right" {...props}/>;
}

function Operation({texts, _className, className, r, textAttrs, fontSize, textHeight, unicodeFontSize, unicodeTextHeight, underlay, overlay, ...props}) {
  if (!Array.isArray(texts)) texts = [texts];
  return <Svg className={`operation ${_className} ${className}`} {...props}>
    {underlay}
    <circle className="operation-circle bot-fill" cx={0} cy={0} r={r}/>
    {texts.map((text, i) => {
      let fs;
      let th;
      if (/^\w+$/.test(text)) {
        fs = fontSize;
        th = textHeight;
      } else {
        fs = unicodeFontSize;
        th = unicodeTextHeight;
      }
      let y = (i - (texts.length - 1) / 2) * th;
      return <text key={i} x={0} y={y} style={{fontSize:fs}} {...textAttrs}>{text}</text>;
    })}
    {overlay}
  </Svg>;
}
Operation.defaultProps = {
  texts: [],
  r: 0.6,
  textAttrs: {
    dominantBaseline: "central",
    textAnchor: "middle",
    lengthAdjust: "spacingAndGlyphs",
  },
  fontSize: 0.30,
  textHeight: 0.35,
  unicodeFontSize: 0.5,
  unicodeTextHeight: 0.45,
  _className: "",
  className: "",
};
function UnicodeOperation(props) {
  return <Operation unicodeFontSize={0.8} {...props}/>;
}

export function Start(props) {
  return <Operation texts="START" _className="start" {...props}/>
}
export function Next(props) {
  return <Operation texts="NEXT" _className="next" {...props}/>
}
export function Grab(props) {
  return <Operation texts="GRAB" _className="grab" {...props}/>
}
export function Drop(props) {
  return <Operation texts="DROP" _className="drop" {...props}/>
}
export function Swap(props) {
  return <Operation texts={["GRAB", "DROP"]} _className="swap" {...props}/>
}
export function Latch(props) {
  return <Operation texts="LOCK" _className="latch" {...props}/>
}
export function Unlatch(props) {
  return <Operation texts="FREE" _className="latch" {...props}/>
}
export function ToggleLatch(props) {
  return <Operation texts={["LOCK", "FREE"]} _className="togglelatch" {...props}/>
}
export function Relatch(props) {
  return <Operation texts="RESET" _className="relatch" {...props}/>
}
// export function Relatch(props) {
  // return <UnicodeOperation texts="💥" _className="relatch" {...props}/>
// }
export function Sync(props) {
  return <UnicodeOperation texts="🗘" _className="sync" {...props}/>
}
export function Rotate(props) {
  return <UnicodeOperation texts="⭮" _className="rotate" {...props}/>
}
export function Power0(props) {
  return <Operation texts={["PWR", "ℵ"]} _className="power0" {...props}/>
}
export function Power1(props) {
  return <Operation texts={["PWR", "ב"]} _className="power1" {...props}/>
}

function Branch({dx, dy, children, className, arrowProps, branchRadius, ...props}) {
  return <Operation className={className}
    underlay={<DirectionArrow className="branch-arrow" dx={dx} dy={dy} drawGhost={false} drawTail {...arrowProps}/>}
    overlay={children(branchRadius)}
    {...props}
    />
}
Branch.defaultProps = {
  className: "",
  arrowProps: {
    headDistance: 0.7,
  },
  branchRadius: 0.5,
};

function Branch1(props) {
  return <Branch {...props}>
    {r => <path
      className="branch-overlay"
      d={`
      M ${r} 0
      A ${r} ${r} 0 0 0 ${r/Math.sqrt(2)} ${-r/Math.sqrt(2)}
      L ${-r/Math.sqrt(2)} ${r/Math.sqrt(2)}
      A ${r} ${r} 0 0 1 ${-r} 0
      Z
      `}
    />}
  </Branch>
}
function Branch0(props) {
  return <Branch {...props}>
    {r => <path
      className="branch-overlay"
      d={`
      M 0 ${-r}
      A ${r} ${r} 0 0 0 ${-r/Math.sqrt(2)} ${-r/Math.sqrt(2)}
      L ${r/Math.sqrt(2)} ${r/Math.sqrt(2)}
      A ${r} ${r} 0 0 1 0 ${r}
      Z
      `}
    />}
  </Branch>
}

export function Branch1Up(props) {
  return <Branch1 className="branch1up" dx={0} dy={-1} {...props}/>;
}
export function Branch1Down(props) {
  return <Branch1 className="branch1down" dx={0} dy={1} {...props}/>;
}
export function Branch1Left(props) {
  return <Branch1 className="branch1left" dx={-1} dy={0} {...props}/>;
}
export function Branch1Right(props) {
  return <Branch1 className="branch1right" dx={1} dy={0} {...props}/>;
}
export function Branch0Up(props) {
  return <Branch0 className="branch0up" dx={0} dy={-1} {...props}/>;
}
export function Branch0Down(props) {
  return <Branch0 className="branch0down" dx={0} dy={1} {...props}/>;
}
export function Branch0Left(props) {
  return <Branch0 className="branch0left" dx={-1} dy={0} {...props}/>;
}
export function Branch0Right(props) {
  return <Branch0 className="branch0right" dx={1} dy={0} {...props}/>;
}

function Star(props) {
  const dx = props.dx;
  return (
    <polygon className="star" points={`0,0 ${dx},0.5 0,1 0.5,${1-dx} 1,1 ${1-dx},0.5 1,0 0.5,${dx}`} {...props}/>
  );
}

function Hatch(props) {
  const rx = 0.3;
  const ry = 0.1;
  return <g {...props}>
    <ellipse cy={0} cx={0} ry={ry} rx={rx} transform="translate(0,0.5) rotate(45)"/>
    <ellipse cy={0} cx={0} ry={ry} rx={rx} transform="translate(1,0.5) rotate(45)"/>
    <ellipse cy={0} cx={0} ry={ry} rx={rx} transform="translate(0.5,0) rotate(-45)"/>
    <ellipse cy={0} cx={0} ry={ry} rx={rx} transform="translate(0.5,1) rotate(-45)"/>
  </g>;
}

function Pattern(props) {
  const s = 100 / props.n;
  return (
    <pattern id={props.id} viewBox="0 0 1 1" width={`${s}%`} height={`${s}%`}>
      {props.children}
    </pattern>
  );
}
Pattern.defaultProps = {
  n: 4,
}

function Cloud(props) {
  const f = 40;
  const octaves = 4;
  const seed = 0;
  return <>
    <filter id="filter-cloud-light">
      <feTurbulence type="fractalNoise" baseFrequency={f} numOctaves={octaves} seed={seed}/>
      <feComponentTransfer>
        <feFuncR type="table" tableValues="1"/>
        <feFuncG type="table" tableValues="1"/>
        <feFuncB type="table" tableValues="1"/>
        <feFuncA type="table" tableValues="0 0 0 0 0.5 1 1"/>
      </feComponentTransfer>
    </filter>
    <filter id="filter-cloud-dark">
      <feTurbulence type="fractalNoise" baseFrequency={f} numOctaves={octaves} seed={seed}/>
      <feComponentTransfer>
        <feFuncR type="table" tableValues="1"/>
        <feFuncG type="table" tableValues="1"/>
        <feFuncB type="table" tableValues="1"/>
        <feFuncA type="table" tableValues="0 0 0.25 0.75 1 1 1"/>
      </feComponentTransfer>
    </filter>
    <mask id="mask-cloud-light">
      <rect x={0} y={0} width={1} height={1} filter="url(#filter-cloud-light)"/>
    </mask>
    <mask id="mask-cloud-dark">
      <rect x={0} y={0} width={1} height={1} filter="url(#filter-cloud-dark)"/>
    </mask>
  </>;
}

export function LightTile(props) {
  const s = 0.0;
  return (
    <svg viewBox="0 0 1 1">
      <rect x={0} y={0} width={1} height={1} fill="lightgray"/>
      <rect x={s} y={s} width={1-2*s} height={1-2*s} fill="url(#tile-pattern)"/>
      <rect fill="bisque" x={0} y={0} width={1} height={1} mask="url(#mask-cloud-light)" transform={`translate(${-props.x},${-props.y}) scale(${props.n},${props.m})`}/>
      {props.children}
    </svg>
  );
}

export function DarkTile(props) {
  const s = 0.0;
  return (
    <svg viewBox="0 0 1 1">
      <rect x={0} y={0} width={1} height={1} fill="lightgray"/>
      <rect x={s} y={s} width={1-2*s} height={1-2*s} fill="url(#tile-pattern)"/>
      <rect fill="bisque" x={0} y={0} width={1} height={1} mask="url(#mask-cloud-dark)" transform={`translate(${-props.x},${-props.y}) scale(${props.n},${props.m})`}/>
      {props.children}
    </svg>
  );
}

export function CrystalTile(props) {
  const s = 0.0;
  const crystalOpacity = 0.5;
  return (
    <DarkTile {...props}>
      <rect x={s} y={s} width={1-2*s} height={1-2*s} opacity={crystalOpacity} fill="url(#crystal-pattern)"/>
    </DarkTile>
  )
}

export function SvgDefs() {
  const pattern = <Hatch fill="#abc"/>;
  const crystalPattern = <Star dx={0.25} fill="#cba"/>;
  return (
    <svg width={0} height={0}>
      <Pattern id="tile-pattern">
        {pattern}
      </Pattern>
      <Pattern id="crystal-pattern">
        {crystalPattern}
      </Pattern>
      <Cloud/>
    </svg>
  );
}
