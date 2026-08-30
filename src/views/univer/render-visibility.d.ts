interface RenderVisibilityController {
  activate: () => void
  deactivate: () => void
}

export function observeRenderVisibility(
  render: RenderVisibilityController,
  container: Element,
): () => void
