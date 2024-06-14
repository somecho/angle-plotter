const RECT_SIZE = 14;

const canvas = document.createElement("canvas")
canvas.id = "myCanvas"
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild(canvas)

/**
 * @typedef {Object} GraphNode
 * @property {number} x 
 * @property {number} y
 * @property {boolean} [active]
 */

/**
 * @typedef {Object} Edge
 * @property {number} idxA
 * @property {number} idxB
 */

const ctx = canvas.getContext("2d")

/** @type {GraphNode[]} */
let nodes = [];

/** @type {Edge[]} */
let edges = [];

/**
 * @param {number} mouseX
 * @param {number} mouseY
 * @returns {(undefined | GraphNode)}
 */
function getSelectedNode(mouseX, mouseY) {
  for (let i = 0; i < nodes.length; i++) {
    let { x, y } = nodes[i]
    const dx = Math.abs(x - mouseX)
    const dy = Math.abs(y - mouseY)
    if (dx < (RECT_SIZE * 0.5) && dy < (RECT_SIZE * 0.5)) {
      return i
    }
  }
  return undefined
}

function setup() {
  ctx.fillStyle = "#11f9b9"
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
}

function getLastActiveNodeIndex() {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].active) {
      return i
    }
  }
  return undefined
}

function findPivots() {
  return nodes
    .map((_, i) => ({
      edges: edges.filter(edge => edge.idxA == i || edge.idxB == i),
      anchor: i
    }))
    .filter(group => group.edges.length > 1)
}

function onMouseUp(e) {
  let idx = getSelectedNode(e.clientX, e.clientY)
  const lastActive = getLastActiveNodeIndex()
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].active = false;
  }
  if (idx == undefined) {
    if (nodes.length != 0) {
      edges.push({
        idxA: nodes.length,
        idxB: lastActive,
      })
    }
    nodes.push({ x: e.clientX, y: e.clientY, active: true })
  } else {
    const edgeExists = edges.find((edge) => {
      return (edge.idxA == idx && edge.idxB == lastActive) ||
        (edge.idxA == lastActive && edge.idxB == idx)
    })
    if (!edgeExists) {
      edges.push({
        idxA: idx,
        idxB: lastActive
      })
    }
    nodes[idx].active = true;
  }
  setup()
  renderEdges()
  renderNodes()
  renderAngles()
}

function renderEdges() {
  ctx.strokeStyle = "#ff8888"
  edges.forEach(({ idxA, idxB }) => {
    ctx.beginPath()
    ctx.moveTo(nodes[idxA].x, nodes[idxA].y)
    ctx.lineTo(nodes[idxB].x, nodes[idxB].y)
    ctx.stroke();
  })
}

function renderNodes() {
  ctx.fillStyle = "#ff8888"
  nodes.forEach(({ x, y, active }) => {
    ctx.fillRect(x - (RECT_SIZE * 0.5), y - (RECT_SIZE * 0.5), RECT_SIZE, RECT_SIZE)
    if (active) {
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 1
      ctx.strokeRect(x - (RECT_SIZE * 0.5), y - (RECT_SIZE * 0.5), RECT_SIZE, RECT_SIZE)
    }
  })
}

/**
 * 
 * @param {GraphNode} source 
 * @param {GraphNode} target 
 * @param {number} anchor 
 */
function getAngleOfLine(target, source) {
  const x = target.x - source.x
  const y = target.y - source.y
  return Math.atan2(y, x) + Math.PI
}

function renderAngles() {
  const groups = findPivots()
  groups.forEach(({ edges, anchor }) => {
    //case where only two edges
    if (edges.length == 2) {
      const sortedEdges = edges.map(edge => {
        if (edge.idxA == anchor) {
          return edge
        } else {
          return {
            idxA: edge.idxB,
            idxB: edge.idxA,
          }
        }
      })
      const edgeAngles = sortedEdges
        .map(edge => getAngleOfLine(nodes[edge.idxA], nodes[edge.idxB]))
        .sort((a, b) => a - b)
      let startAngle = 0
      const dTheta = Math.abs(edgeAngles[0] - edgeAngles[1])
      const dThetaPeriod = Math.abs(edgeAngles[1] - (edgeAngles[0] + Math.PI * 2))
      if (dThetaPeriod < dTheta) {
        startAngle = 1
      }
      ctx.beginPath()
      ctx.strokeStyle = "#ff8888"
      ctx.arc(nodes[anchor].x, nodes[anchor].y, 24, edgeAngles[startAngle], edgeAngles[1 - startAngle])
      ctx.stroke()
    }
  })
}

setup()

canvas.addEventListener('mouseup', onMouseUp)
