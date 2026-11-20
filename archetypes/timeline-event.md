+++
title = {{ replace .File.ContentBaseName "-" " " | title | jsonify }}
age = "creation" # creation, discovery, or pilgrimage
timelineDate = "" # Display label, e.g. "Approx. 2,500 B.D." or "Early Third Age"
weight = 10 # Reading order within the age. Lower numbers appear first.
draft = true
sidebar = false
sidebarOverview = false

[_build]
  list = "local"
  render = "never"
+++

<!-- Write the event here. Markdown paragraphs, links, and lists are supported.
Set draft = false when ready. Leave the _build settings in place so the event
appears on the timeline without creating a separate event page. -->
