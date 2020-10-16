import React from "react";

function shallowEqual(x, y) {
  // don't care about undefined
  if (x === y) return true;
  if (!x || !y) return false;
  for (const key in x) if (x[key] !== y[key]) return false;
  for (const key in y) if (x[key] !== y[key]) return false;
  return true;
}

// Cells are overlaid over grid squares without padding and we take care of padding here.
// This is necessary for sizing to be correct on cells spanning multiple squares.
const PADDING = 0.06;
const BOT_PADDING = 0.02;

function Svg({w, h, className, children, ...props}) {
  return <span className={`svg-container ${className}`}{...props}>
    <svg viewBox={`${-w} ${-h} ${2*w} ${2*h}`}>{children}</svg>
  </span>;
}
Svg.defaultProps = {w:1, h:1, className:""};

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
  return <g className="cell-fill">
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
  return <g className="cell-fill">
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

export const XCell = React.memo(props => {
  const {w, h, _className, className, ..._props} = Object.assign({w:1, h:1, _className:"cell-x", className:""}, props);
  return <Svg w={w} h={h} className={`${_className} ${className}`} {..._props}>
    <CellBorder w={w} h={h}/>
    <XCellFill/>
  </Svg>;
});
export const PlusCell = React.memo(props => {
  const {w, h, _className, className, ..._props} = Object.assign({w:1, h:1, _className:"cell-plus", className:""}, props);
  return <Svg w={w} h={h} className={`${_className} ${className}`} {..._props}>
    <CellBorder w={w} h={h}/>
    <PlusCellFill/>
  </Svg>;
});
export const HorizontalCell = React.memo(props => {
  return <XCell _className="cell-x horizontal cell-horizontal" w={2} {...props}/>;
});
export const VerticalCell = React.memo(props => {
  return <XCell _className="cell-x vertical cell-vertical" h={2} {...props}/>;
});

function Diode({dx, dy, headDistance, headLength, headAngle, className, ...props}) {
  let x = dx * headDistance;
  let y = dy * headDistance;
  let w = dx ? 2 : 1;
  let h = dy ? 2 : 1;
  return <Svg w={w} h={h} className={`diode cell-x ${className}`} {...props}>
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

export const DiodeUp = React.memo(props => {
  return <Diode dx={0} dy={-1} className="vertical diode-up" {...props}/>;
});
export const DiodeDown = React.memo(props => {
  return <Diode dx={0} dy={1} className="vertical diode-down" {...props}/>;
});
export const DiodeLeft = React.memo(props => {
  return <Diode dx={-1} dy={0} className="horizontal diode-left" {...props}/>;
});
export const DiodeRight = React.memo(props => {
  return <Diode dx={1} dy={0} className="horizontal diode-right" {...props}/>;
});

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

export const DirectionUp = React.memo(props => {
  return <Direction dx={0} dy={-1} _className="direction-up" {...props}/>;
});
export const DirectionDown = React.memo(props => {
  return <Direction dx={0} dy={1} _className="direction-down" {...props}/>;
});
export const DirectionLeft = React.memo(props => {
  return <Direction dx={-1} dy={0} _className="direction-left" {...props}/>;
});
export const DirectionRight = React.memo(props => {
  return <Direction dx={1} dy={0} _className="direction-right" {...props}/>;
});

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

export const Start = React.memo(props => {
  return <Operation texts="START" _className="start" {...props}/>
});
export const Next = React.memo(props => {
  return <Operation texts="NEXT" _className="next" {...props}/>
});
export const Grab = React.memo(props => {
  return <Operation texts="GRAB" _className="grab" {...props}/>
});
export const Drop = React.memo(props => {
  return <Operation texts="DROP" _className="drop" {...props}/>
});
export const Swap = React.memo(props => {
  return <Operation texts={["GRAB", "DROP"]} _className="swap" {...props}/>
});
export const Latch = React.memo(props => {
  return <Operation texts="LOCK" _className="latch" {...props}/>
});
export const Unlatch = React.memo(props => {
  return <Operation texts="FREE" _className="latch" {...props}/>
});
export const ToggleLatch = React.memo(props => {
  return <Operation texts={["LOCK", "FREE"]} _className="togglelatch" {...props}/>
});
export const Relatch = React.memo(props => {
  return <Operation texts="RESET" _className="relatch" {...props}/>
});
// export const Relatch = React.memo(props => {
  // return <UnicodeOperation texts="💥" _className="relatch" {...props}/>
// });
export const Sync = React.memo(props => {
  // return <UnicodeOperation texts="🗘" _className="sync" {...props}/>
  return <Operation texts="SYNC" _className="sync" {...props}/>
});
export const Rotate = React.memo(props => {
  // return <UnicodeOperation texts="⭮" _className="rotate" {...props}/>
  return <Operation texts="FLIP" _className="rotate" {...props}/>
});
export const Power0 = React.memo(props => {
  return <Operation texts={["PWR", "ℵ"]} _className="power0" {...props}/>
});
export const Power1 = React.memo(props => {
  return <Operation texts={["PWR", "ב"]} _className="power1" {...props}/>
});

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

export const Branch1Up = React.memo(props => {
  return <Branch1 className="branch1up" dx={0} dy={-1} {...props}/>;
});
export const Branch1Down = React.memo(props => {
  return <Branch1 className="branch1down" dx={0} dy={1} {...props}/>;
});
export const Branch1Left = React.memo(props => {
  return <Branch1 className="branch1left" dx={-1} dy={0} {...props}/>;
});
export const Branch1Right = React.memo(props => {
  return <Branch1 className="branch1right" dx={1} dy={0} {...props}/>;
});
export const Branch0Up = React.memo(props => {
  return <Branch0 className="branch0up" dx={0} dy={-1} {...props}/>;
});
export const Branch0Down = React.memo(props => {
  return <Branch0 className="branch0down" dx={0} dy={1} {...props}/>;
});
export const Branch0Left = React.memo(props => {
  return <Branch0 className="branch0left" dx={-1} dy={0} {...props}/>;
});
export const Branch0Right = React.memo(props => {
  return <Branch0 className="branch0right" dx={1} dy={0} {...props}/>;
});

export const RightArrow = React.memo(props => {
  return (
    <Svg {...props}>
      <Arrow className="rightarrow" x1={-0.5} y1={0} x2={0.5} y2={0} headAngle={Math.PI/4} headLength={0.5} drawTail/>
    </Svg>
  );
});

export const Path = React.memo(
  props => {
    const {path, radius, terminalRadius, className, _props} = Object.assign({
      path: {},
      className: "",
      radius: 0.2,
      terminalRadius: 0.05,
    }, props);
    const r = radius;
    const terminal = (path.up ^ path.down) || (path.left ^ path.right);
    const c = terminal ? terminalRadius : 0;
    return (
      <Svg className={`path ${className}`} {..._props}>
        <g className="bot-stroke">
          {path.up && <line x1={0} y1={-c} x2={0} y2={-1}/>}
          {path.down && <line x1={0} y1={c} x2={0} y2={1}/>}
          {path.left && <line x1={-c} y1={0} x2={-1} y2={0}/>}
          {path.right && <line x1={c} y1={0} x2={1} y2={0}/>}
          {path.upleft && <path d={`M 0 -1 L 0 ${-r} A ${r} ${r} 0 0 1 ${-r} 0 L -1 0`}/>}
          {path.upright && <path d={`M 0 -1 L 0 ${-r} A ${r} ${r} 0 0 0 ${r} 0 L 1 0`}/>}
          {path.downleft && <path d={`M 0 1 L 0 ${r} A ${r} ${r} 0 0 0 ${-r} 0 L -1 0`}/>}
          {path.downright && <path d={`M 0 1 L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 L 1 0`}/>}
          {terminal && <circle cx={0} cy={0} r={c}/>}
        </g>
      </Svg>
    );
  },
  ({path: prevPath, ...prevRest}, {path: nextPath, ...nextRest}) => {
    if (!shallowEqual(prevPath, nextPath)) return false;
    if (!shallowEqual(prevRest, nextRest)) return false;
    return true;
  },
);


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

export const LightTile = React.memo(props => {
  const s = 0.0;
  return (
    <svg viewBox="0 0 1 1">
      <rect x={0} y={0} width={1} height={1} fill="lightgray"/>
      <rect x={s} y={s} width={1-2*s} height={1-2*s} fill="url(#tile-pattern)"/>
      <rect fill="bisque" x={0} y={0} width={1} height={1} mask="url(#mask-cloud-light)" transform={`translate(${-props.x},${-props.y}) scale(${props.n},${props.m})`}/>
      {props.children}
    </svg>
  );
});

export const DarkTile = React.memo(props => {
  const s = 0.0;
  return (
    <svg viewBox="0 0 1 1">
      <rect x={0} y={0} width={1} height={1} fill="lightgray"/>
      <rect x={s} y={s} width={1-2*s} height={1-2*s} fill="url(#tile-pattern)"/>
      <rect fill="bisque" x={0} y={0} width={1} height={1} mask="url(#mask-cloud-dark)" transform={`translate(${-props.x},${-props.y}) scale(${props.n},${props.m})`}/>
      {props.children}
    </svg>
  );
});

export const CrystalTile = React.memo(props => {
  const s = 0.0;
  const crystalOpacity = 0.5;
  return (
    <DarkTile {...props}>
      <rect x={s} y={s} width={1-2*s} height={1-2*s} opacity={crystalOpacity} fill="url(#crystal-pattern)"/>
    </DarkTile>
  )
});

export const CleanCrystalTile = React.memo(props => {
  const s = 0.0;
  const crystalOpacity = 1;
  return (
    <svg viewBox="0 0 1 1">
      <rect x={s} y={s} width={1-2*s} height={1-2*s} opacity={crystalOpacity} fill="url(#clean-crystal-pattern)"/>
    </svg>
  );
});

export const SvgDefs = React.memo(() => {
  const pattern = <Hatch fill="#abc"/>;
  const crystalPattern = <Star dx={0.25} fill="#cba"/>;
  const cleanCrystalPattern = <Star dx={0.25} fill="#dba"/>;
  return (
    <svg width={0} height={0}>
      <Pattern id="tile-pattern">
        {pattern}
      </Pattern>
      <Pattern id="crystal-pattern">
        {crystalPattern}
      </Pattern>
      <Pattern id="clean-crystal-pattern">
        {cleanCrystalPattern}
      </Pattern>
      <Cloud/>
    </svg>
  );
});

export const Wheel = React.memo(() => {
  const R = 0.8;
  const r = 0.4;
  const rr = 0.2;
  const h = 0.1;
  const w = 0.02;
  const s = 0.5;
  return (
    <Svg className="wheel">
      <g style={{strokeWidth:w}}>
        <circle cx={0} cy={0} r={R}/>
        <circle cx={0} cy={r} r={rr} fill="blue"/>
        <circle cx={-r/2*Math.sqrt(3)} cy={-r/2} r={rr} fill="green"/>
        <circle cx={r/2*Math.sqrt(3)} cy={-r/2} r={rr} fill="green"/>
        <line x1={0} y1={R} x2={0} y2={R-h}/>
        <line x1={-R/2*Math.sqrt(3)} y1={-R/2} x2={-(R-h)/2*Math.sqrt(3)} y2={-(R-h)/2}/>
        <line x1={R/2*Math.sqrt(3)} y1={-R/2} x2={(R-h)/2*Math.sqrt(3)} y2={-(R-h)/2}/>
        <line x1={0} y1={0} x2={0} y2={h}/>
        <line x1={0} y1={0} x2={-h/2*Math.sqrt(3)} y2={-h/2}/>
        <line x1={0} y1={0} x2={h/2*Math.sqrt(3)} y2={-h/2}/>
        <rect x={-s/2} y={r-s/2} width={s} height={s} style={{stroke:"red"}}/>
      </g>
    </Svg>
  );
});
