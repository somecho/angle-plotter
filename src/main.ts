const RECT_SIZE = 6;
let nodes: GraphNode[] = [];
let edges: Edge[] = [];
let img = new Image();
const MAIN_COL = "#fa0a76"

enum Orientation { Portrait, Landscape }

const canvas = document.createElement("canvas")
document.querySelector("#app")?.appendChild(canvas)
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
if (window.innerWidth > 860) {
  canvas.width = 860
} else if (window.innerWidth < 320) {
  canvas.width = 320
} else {
  canvas.width = window.innerWidth * 0.95;
}
canvas.height = window.innerHeight - canvas.getBoundingClientRect().top - (window.innerHeight * 0.02)
ctx.textBaseline = "middle"
ctx.textAlign = "center"
ctx.font = "14px Silkscreen"

canvas.addEventListener('mouseup', onMouseUp)
setup()

document.querySelector("#clear-btn")?.addEventListener("click", () => {
  nodes = []
  edges = []
  setup()

})

function getImageOrientation(img: HTMLImageElement): Orientation {
  return img.width > img.height ? Orientation.Landscape : Orientation.Portrait
}

document.querySelector("#upload-btn")?.addEventListener("change", (e) => {
  const reader = new FileReader()
  reader.addEventListener("load", (e) => {
    img = new Image()
    img.addEventListener("load", (e) => {
      nodes = []
      edges = []
      const imageOrientation = getImageOrientation(img)
      if (imageOrientation == Orientation.Landscape) {
        canvas.height = (img.height / img.width) * canvas.width
      } else {
        canvas.width = (img.width / img.height) * canvas.height
      }
      ctx.textBaseline = "middle"
      ctx.textAlign = "center"
      ctx.font = "14px Silkscreen"
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    })
    img.src = e.target?.result as string
  })
  const target = e.target as HTMLInputElement;
  reader.readAsDataURL((target.files as FileList)[0])
})

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
  if (img.width == 0 && img.height == 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
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