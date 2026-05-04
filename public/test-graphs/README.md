# Test Graphs for Graph Algorithms

This directory contains persistent test graphs organized by algorithm for reproducible testing of the graph visualization application.

## Folder Structure

```
test-graphs/
├── dijkstra/                    # Dijkstra shortest path
├── bellman-ford/                # Bellman-Ford shortest path  
├── bellman/                     # Bellman algorithm (alias for Bellman-Ford)
├── dfs/                         # Depth-First Search traversal
├── bfs/                         # Breadth-First Search traversal
├── kruskal/                     # Kruskal's minimum spanning tree
├── prim/                        # Prim's minimum spanning tree
├── bipartite-check/             # Bipartite graph detection
├── cycle-detection/             # Cycle detection
├── tree-check/                  # Tree validation
├── connected-components/        # Connected components detection
├── edge-coloring/               # Edge coloring
├── welsh-powell/                # Welsh-Powell node coloring
├── ford-fulkerson/              # Ford-Fulkerson max flow
├── kosaraju/                    # Kosaraju strongly connected components
├── regular-graph/               # Regular graph detection
├── eulerian-path/               # Eulerian path/circuit detection
└── shortest-unweighted-path/    # Shortest path in unweighted graphs
```

Each algorithm directory contains **4 test variants**:
- **simple.json** - Basic test case with few nodes, straightforward structure
- **complex.json** - More nodes and edges, testing algorithm's core logic
- **extreme.json** - Large graphs, edge cases, stress testing
- **error.json** - Invalid input for the algorithm (tests error handling)

## JSON Schema

Each test graph file follows the `SessionGraph` interface:

```typescript
interface SessionGraph {
  id: string
  name: string
  description: string
  directed: boolean
  weighted: boolean
  nodes: Array<{
    id: number
    label: string
    x: number
    y: number
  }>
  edges: Array<{
    from: number
    to: number
    weight?: number
    directed?: boolean
  }>
  createdAt: string
  updatedAt: string
}
```

## Usage in Code

Load test graphs programmatically using `src/lib/testGraphs.ts`:

```typescript
import { 
  getTestGraphsForAlgorithm, 
  loadTestGraphById,
  loadTestGraph 
} from '@lib/testGraphs'

// Get all test graphs for an algorithm
const graphs = getTestGraphsForAlgorithm('dijkstra')

// Load a specific test graph
const metadata = graphs[0] // simple variant
const graph = await loadTestGraph(metadata)

// Or load by ID directly
const graph = await loadTestGraphById('dijkstra-simple')
```

## Test Coverage Summary

**Total: 64 test graphs** (16 algorithms × 4 variants)

### Shortest Path Algorithms (3)
- **dijkstra** - Weighted directed (no negative weights)
- **bellman-ford** - Weighted directed (handles negative weights)
- **bellman** - Alias for Bellman-Ford
- **shortest-unweighted-path** - Unweighted graphs

### Traversal Algorithms (2)
- **dfs** - Depth-first search
- **bfs** - Breadth-first search

### Spanning Tree Algorithms (2)
- **kruskal** - Undirected weighted MST
- **prim** - Undirected weighted MST

### Graph Properties (6)
- **bipartite-check** - Tests 2-colorability
- **cycle-detection** - Detects cycles in undirected graphs
- **tree-check** - Validates tree structure
- **connected-components** - Finds connected components
- **eulerian-path** - Tests Eulerian path/circuit existence
- **regular-graph** - Checks regular graph property

### Coloring (2)
- **welsh-powell** - Node coloring (greedy)
- **edge-coloring** - Edge coloring

### Advanced (2)
- **kosaraju** - Strongly connected components (directed)
- **ford-fulkerson** - Maximum flow (requires source/sink)

## Algorithm Characteristics by Variant

### Simple (Basic Functionality)
- Dijkstra-Simple: 4 nodes, 5 edges, basic shortest path
- BFS-Simple: 5 nodes, tree-like structure
- Kruskal-Simple: 4 nodes, basic MST
- Bipartite-Simple: K2,2 complete bipartite
- DFS-Simple: 5 nodes, straightforward traversal

### Complex (Core Testing)
- Dijkstra-Complex: 8 nodes, multiple paths competing
- DFS-Complex: 10 nodes with back edges and cycles
- Kosaraju-Complex: 4 SCCs, multiple edge patterns
- Welsh-Powell-Complex: 6 nodes, practical coloring
- Bellman-Ford-Complex: 8 nodes, typical structure

### Extreme (Stress & Edge Cases)
- Dijkstra-Extreme: 12 nodes, very large weights (100-1000)
- BFS-Extreme: 8 nodes in 2 disconnected components
- Connected-Components-Extreme: 8 isolated nodes
- Eulerian-Path-Extreme: 8-node Eulerian circuit (all even degree)
- Kruskal-Extreme: 10 nodes in 2 components

### Error (Invalid Inputs)
- Dijkstra-Error: Contains negative weights (invalid)
- Kruskal-Error: Directed graph (invalid, must be undirected)
- Kosaraju-Error: Undirected graph (invalid, must be directed)
- Welsh-Powell-Error: Directed graph (invalid, must be undirected)
- Bipartite-Check-Error: Triangle graph (non-bipartite)
- Tree-Check-Error: Contains cycle (not a tree)

## Adding New Test Graphs

To add a test graph:

1. Create JSON file: `public/test-graphs/{algorithm}/{variant}.json`
2. Follow the SessionGraph schema
3. Add metadata to `src/lib/testGraphs.ts`:

```typescript
{ 
  id: 'algorithm-variant', 
  algorithm: 'algorithm',
  variant: 'simple|complex|extreme|error',
  filename: 'algorithm/variant.json',
  name: 'Algorithm - Variant',
  description: 'Brief description of test case'
}
```

## Testing Workflow

1. **Unit Testing**: Use simple variant for basic algorithm validation
2. **Integration Testing**: Use complex variant for realistic scenarios
3. **Stress Testing**: Use extreme variant for performance analysis
4. **Error Handling**: Use error variant to test exception handling


1. Create a JSON file in the appropriate category folder
2. Follow the graph JSON schema (see example below)
3. Update the catalog in `src/lib/testGraphs.ts` to include the new graph

### Graph JSON Schema

```json
{
  "id": "unique-test-id",
  "name": "Display Name",
  "description": "Description of the test graph and what it tests",
  "directed": false,
  "weighted": false,
  "nodes": [
    {
      "id": 0,
      "label": "A",
      "x": 100,
      "y": 100
    }
  ],
  "edges": [
    {
      "from": 0,
      "to": 1,
      "weight": 10,
      "directed": false
    }
  ],
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp"
}
```

## Using Test Graphs

Test graphs can be loaded programmatically via the `src/lib/testGraphs.ts` module:

```typescript
import { testGraphCatalog, getTestGraphById, getTestGraphsByCategory } from '@lib/testGraphs'

// Get all test graphs
const allGraphs = testGraphCatalog

// Get a specific graph
const k33 = getTestGraphById('test-bipartite-k3-3')

// Get graphs for a category
const bipartiteTests = getTestGraphsByCategory('bipartite')
```

## Current Test Graphs

### Bipartite
- **k3-3.json** - Complete bipartite graph K3,3 (3 left, 3 right vertices, 9 edges)

---

Expand this catalog as you add more test cases for comprehensive algorithm testing.
