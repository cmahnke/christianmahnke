import { TimelineVisualizer } from "./tag-timeline.js";

const url = "/meta/posts/index.json";
const tagsUrl = "/meta/tags/index.json";

document.addEventListener("DOMContentLoaded", () => {
  const visualizer = new TimelineVisualizer("timeline-container", url, tagsUrl);
});