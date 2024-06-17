import { background, edgeExists, initializeCanvasSize, initializeContext, initializeTextAttributes } from "./lib";

// GLOBALS ////////////////////////////////////////////////////////////////////
const RECT_SIZE = 6;
const MAIN_COL = "#fa0a76"
let nodes: GraphNode[] = [];
let edges: Edge[] = [];
let img = new Image();


// DOM AND CANVAS SETUP ///////////////////////////////////////////////////////
const canvas = document.createElement("canvas")
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
document.querySelector("#app")?.appendChild(canvas)
initializeCanvasSize(canvas)
initializeContext(ctx)

// EVENTS /////////////////////////////////////////////////////////////////////
const clearBtn = document.querySelector("#clear-btn") as HTMLElement
const saveBtn = document.querySelector("#save-btn") as HTMLElement
const uploadBtn = document.querySelector("#upload-btn") as HTMLElement

clearBtn.onclick = () => {
  nodes = []
  edges = []
  background(ctx, img, canvas.width, canvas.height)
}

saveBtn.onclick = () => {
  const link = document.createElement('a')
  link.download = 'image.png'
  link.href = canvas.toDataURL("image/png")
  link.click()
}

uploadBtn.onchange = (e) => {
  const reader = new FileReader()
  reader.addEventListener("load", (e) => {
    img = new Image()
    img.addEventListener("load", () => {
      initializeCanvasSize(canvas)
      if (img.width > img.height) {
        canvas.height = (img.height / img.width) * canvas.width
      } else {
        canvas.width = (img.width / img.height) * canvas.height
      }
      initializeTextAttributes(ctx)
      clearBtn.click()
    })
    img.src = e.target?.result as string
  })
  const target = e.target as HTMLInputElement;
  reader.readAsDataURL((target.files as FileList)[0])
}

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



function renderEdges() {
  ctx.strokeStyle = MAIN_COL
  ctx.lineWidth = 1;
  edges.forEach(({ idxA, idxB }) => {
    ctx.beginPath()
    ctx.moveTo(nodes[idxA].x, nodes[idxA].y)
    ctx.lineTo(nodes[idxB].x, nodes[idxB].y)
    ctx.stroke();
  })
}

function renderNodes() {
  ctx.fillStyle = MAIN_COL
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
  ctx.strokeStyle = MAIN_COL
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
      let angleDiff = edgeAngles[0] - edgeAngles[edgeAngles.length - 1]
      angleDiff += angleDiff < 0 ? Math.PI : 0

      let angleSize = (((edgeAngles[0] - edgeAngles[edgeAngles.length - 1]) / (Math.PI * 2)) * 360)
      angleSize += angleSize < 0 ? 360 : 0

      const radius = Math.pow(1 - (angleDiff / (Math.PI * 2)), 2.0) * 24 + 10
      const angleText = `${angleSize.toFixed(1)}°`

      ctx.lineWidth = 1
      ctx.strokeStyle = MAIN_COL
      ctx.beginPath()
      ctx.arc(nodes[anchor].x, nodes[anchor].y, radius, edgeAngles[edgeAngles.length - 1], edgeAngles[0])
      ctx.stroke()

      const textAngle = (edgeAngles[0] - edgeAngles[edgeAngles.length - 1]) * 0.5 + edgeAngles[edgeAngles.length - 1]
      let textRadius = 36
      textRadius *= (edgeAngles[0] - edgeAngles[edgeAngles.length - 1]) < 0 ? -1 : 1
      const textX = Math.cos(textAngle) * textRadius + nodes[anchor].x
      const textY = Math.sin(textAngle) * textRadius + nodes[anchor].y

      ctx.strokeStyle = "white"
      ctx.lineWidth = 0.2
      ctx.fillText(angleText, textX, textY)
      ctx.strokeText(angleText, textX, textY)
    }

    for (let i = 0; i < edgeAngles.length - 1; i++) {
      let angleDiff = edgeAngles[i + 1] - edgeAngles[i]
      angleDiff += angleDiff < 0 ? Math.PI : 0

      let angleSize = (((edgeAngles[i + 1] - edgeAngles[i]) / (Math.PI * 2)) * 360)
      angleSize += angleSize < 0 ? 360 : 0

      const radius = Math.pow(1 - (angleDiff / (Math.PI * 2)), 2.0) * 24 + 10
      const angleText = `${angleSize.toFixed(1)}°`

      ctx.lineWidth = 1
      ctx.strokeStyle = MAIN_COL
      ctx.beginPath()
      ctx.arc(nodes[anchor].x, nodes[anchor].y, radius, edgeAngles[i], edgeAngles[i + 1])
      ctx.stroke()

      const textAngle = (edgeAngles[i + 1] - edgeAngles[i]) * 0.5 + edgeAngles[i]
      let textRadius = 36
      textRadius *= (edgeAngles[i + 1] - edgeAngles[i]) < 0 ? -1 : 1
      const textX = Math.cos(textAngle) * textRadius + nodes[anchor].x
      const textY = Math.sin(textAngle) * textRadius + nodes[anchor].y

      ctx.strokeStyle = "white"
      ctx.fillText(angleText, textX, textY)
      ctx.lineWidth = 0.2
      ctx.strokeText(angleText, textX, textY)
    }
  })
}

canvas.onmouseup = (e: MouseEvent) => {
  const idx = getSelectedNode(e.offsetX, e.offsetY)
  const lastActive = getLastActiveNodeIndex()
  nodes.forEach(node => node.active = false)
  if (idx == undefined) {
    if (nodes.length != 0) {
      edges.push({
        idxA: nodes.length,
        idxB: lastActive as Id,
      })
    }
    nodes.push({ x: e.offsetX, y: e.offsetY, active: true })
  } else {
    if (!edgeExists(edges, idx, lastActive as Id)) {
      edges.push({
        idxA: idx,
        idxB: lastActive as Id
      })
    }
    nodes[idx].active = true;
  }
  background(ctx, img, canvas.width, canvas.height)
  renderEdges()
  renderNodes()
  renderAngles()
}