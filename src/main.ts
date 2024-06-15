const RECT_SIZE = 14;
let nodes: GraphNode[] = [];
let edges: Edge[] = [];

const canvas = document.createElement("canvas")
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild(canvas)
canvas.addEventListener('mouseup', onMouseUp)
setup()

function getSelectedNode(mouseX: number, mouseY: number): Id | undefined {
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

function getLastActiveNodeIndex(): Id | undefined {
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

function onMouseUp(e: MouseEvent) {
  const idx = getSelectedNode(e.clientX, e.clientY)
  const lastActive = getLastActiveNodeIndex()
  nodes.forEach(node => node.active = false)
  if (idx == undefined) {
    if (nodes.length != 0) {
      edges.push({
        idxA: nodes.length,
        idxB: lastActive as Id,
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
        idxB: lastActive as Id
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

function getAngleOfLine(target: GraphNode, source: GraphNode): AngleRadians {
  const x = target.x - source.x
  const y = target.y - source.y
  return Math.atan2(y, x) + Math.PI
}

function renderAngles() {
  ctx.strokeStyle = "#ff8888"
  const groups = findPivots()
  groups.forEach(({ edges, anchor }) => {
    const sortedEdges = edges.map(edge =>
      edge.idxA == anchor ? edge : { idxA: edge.idxB, idxB: edge.idxA }
    )
    let edgeAngles = sortedEdges
      .map(edge => getAngleOfLine(nodes[edge.idxA], nodes[edge.idxB]))
      .sort((a, b) => a - b)

    if (edges.length == 2) {
      const dTheta = Math.abs(edgeAngles[0] - edgeAngles[1])
      const dThetaPeriod = Math.abs(edgeAngles[1] - (edgeAngles[0] + Math.PI * 2))
      if (dThetaPeriod < dTheta) {
        const temp = edgeAngles[1]
        edgeAngles[1] = edgeAngles[0]
        edgeAngles[0] = temp
      }
    } else {
      ctx.beginPath()
      ctx.arc(nodes[anchor].x, nodes[anchor].y, 24, edgeAngles[edgeAngles.length - 1], edgeAngles[0])
      ctx.stroke()
    }

    for (let i = 0; i < edgeAngles.length - 1; i++) {
      let angleDiff = edgeAngles[i + 1] - edgeAngles[i]
      if (angleDiff < 0) {
        angleDiff += Math.PI
      }
      const radius = Math.pow(1 - (angleDiff / (Math.PI * 2)), 2.0) * 24 + 10
      ctx.beginPath()
      ctx.arc(nodes[anchor].x, nodes[anchor].y, radius, edgeAngles[i], edgeAngles[i + 1])
      ctx.stroke()
    }
  })
}
