export function addClickStopPropagation(element: HTMLElement, method: () => void) {
  element.addEventListener("click", event => {
    method();
    event.stopPropagation();
  });
}
