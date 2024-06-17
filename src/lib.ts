import { RECT_SIZE } from "./constants"

export function initializeCanvasSize(canvas: HTMLCanvasElement) {
    const ww = window.innerWidth
    const wh = window.innerHeight
    canvas.width = ww > 860 ? 860 : ww < 320 ? 320 : ww * 0.95
    canvas.height = wh - canvas.getBoundingClientRect().top - (wh * 0.08)
}

export function initializeTextAttributes(context: CanvasRenderingContext2D) {
    context.textBaseline = "middle"
    context.textAlign = "center"
    context.font = "14px Silkscreen"
}

export function initializeContext(context: CanvasRenderingContext2D) {
    const font = new FontFace('Silkscreen', 'url(assets/Silkscreen-Regular.ttf)')
    document.fonts.add(font)
    font.load().then(() => {
        initializeTextAttributes(context)
    })
}

export function background(context: CanvasRenderingContext2D, image: HTMLImageElement, width, height) {
    if (image.width == 0 && image.height == 0) {
        context.clearRect(0, 0, width, height)
    } else {
        context.drawImage(image, 0, 0, width, height)
    }
}

/** Checks whether an edge with the given node IDs already exist in edge array */
export function edgeExists(allEdges: Edge[], idxA: Id, idxB: Id): boolean {
    const edgeExists = allEdges.find((edge) => {
        return (edge.idxA == idxA && edge.idxB == idxB) ||
            (edge.idxA == idxB && edge.idxB == idxA)
    })
    return edgeExists != undefined
}

export function getSelectedNode(nodes: GraphNode[], mouseX: number, mouseY: number): Id | undefined {
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

export function getLastActiveNodeIndex(nodes: GraphNode[]): Id | undefined {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].active) {
      return i
    }
  }
  return undefined
}