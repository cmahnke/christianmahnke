# Tag ring

# Idea

- Use a circular Sankey digram to vissualize tag relations
- Connect tags occuring in the same post
- Use links between tags to link to a page representing tag pairs

# Data Structures

```
type FlowInputRecord = [string, string, URL, URL];
```

- Tag from
- Tag to
- URL of tag list
- URL of post
