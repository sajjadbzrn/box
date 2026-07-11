import type { Handler, HttpMethod, MatchResult } from "./types";

/**
 * A single node in the radix (Patricia) trie.
 */
class RadixNode {
  /** The URL segment prefix stored at this node. */
  prefix: string;
  /** Map from first character of child's prefix to child node. */
  children: Map<string, RadixNode>;
  /** If this is a `:param` node, the child node for the dynamic segment. */
  paramChild: RadixNode | null;
  /** If this is a `*` wildcard node, the handler for the wildcard match. */
  wildcardHandler: Handler | null;
  /** Handler for an exact match at this node. */
  handler: Handler | null;
  /** The parameter name when this segment is a `:param` placeholder. */
  paramName: string | null;

  constructor(prefix: string = "") {
    this.prefix = prefix;
    this.children = new Map();
    this.paramChild = null;
    this.wildcardHandler = null;
    this.handler = null;
    this.paramName = null;
  }
}

/**
 * Splits a path into segments, ignoring leading/trailing slashes.
 */
function splitPath(path: string): string[] {
  if (path === "/") return [];
  return path.split("/").filter((s) => s.length > 0);
}

/**
 * Radix-tree router with support for static, dynamic (`:id`), and wildcard (`*`) routes.
 *
 * The radix tree compresses common prefixes into nodes, yielding O(path_length)
 * lookups with minimal memory overhead.
 */
export class Router {
  private trees: Map<HttpMethod, RadixNode>;

  constructor() {
    this.trees = new Map();
  }

  /** Returns or creates the root node for a given HTTP method. */
  private getTree(method: HttpMethod): RadixNode {
    let root = this.trees.get(method);
    if (!root) {
      root = new RadixNode();
      this.trees.set(method, root);
    }
    return root;
  }

  /**
   * Register a route handler for the given method and path.
   *
   * Path patterns:
   *   - `/static/path`    — exact match
   *   - `/user/:id`       — dynamic segment, captured as `params.id`
   *   - `/files/*`        — wildcard, captures remaining path as `params["*"]`
   */
  add(method: HttpMethod, path: string, handler: Handler): void {
    const root = this.getTree(method);
    const segments = splitPath(path);
    this.insert(root, segments, handler);
  }

  /**
   * Insert a path (as segments) into the radix tree rooted at `node`.
   */
  private insert(node: RadixNode, segments: string[], handler: Handler): void {
    // Base case: no more segments — set handler on current node
    if (segments.length === 0) {
      node.handler = handler;
      return;
    }

    const segment = segments[0]!;
    const rest = segments.slice(1);

    // Wildcard segment
    if (segment === "*") {
      node.wildcardHandler = handler;
      return;
    }

    // Dynamic segment (:param)
    if (segment.startsWith(":")) {
      const paramName = segment.slice(1);
      if (!node.paramChild) {
        node.paramChild = new RadixNode();
        node.paramChild.paramName = paramName;
      }
      this.insert(node.paramChild, rest, handler);
      return;
    }

    // Static segment — try to find a common prefix with existing children
    const firstChar = segment[0]!;
    let child = node.children.get(firstChar);

    if (!child) {
      // No matching child — create a new one
      child = new RadixNode(segment);
      node.children.set(firstChar, child);
      this.insert(child, rest, handler);
      return;
    }

    // Find common prefix between segment and child.prefix
    const commonLen = commonPrefixLength(segment, child.prefix);

    if (commonLen === child.prefix.length) {
      // Child's entire prefix is contained in the segment.
      if (segment.length > commonLen) {
        // Segment extends beyond child's prefix — add remainder as a new child node
        this.insertSplit(child, segment, rest, handler, commonLen);
        return;
      }
      // Segment fully consumed by the prefix — continue with remaining segments
      this.insert(child, rest, handler);
      return;
    }

    // Partial overlap — need to split the child node
    this.splitNode(node, segment, child, firstChar, rest, handler, commonLen);
  }

  /**
   * Split a node when the inserted segment shares a partial prefix
   * with an existing child.
   */
  private splitNode(
    parent: RadixNode,
    segment: string,
    child: RadixNode,
    firstChar: string,
    rest: string[],
    handler: Handler,
    commonLen: number,
  ): void {
    // Create a new intermediate node for the common prefix
    const commonPrefix = segment.slice(0, commonLen);
    const segRemaining = segment.slice(commonLen);
    const oldRemaining = child.prefix.slice(commonLen);

    const intermediate = new RadixNode(commonPrefix);

    // Move child's properties to the intermediate
    // The old child will be repositioned under the intermediate
    child.prefix = oldRemaining;
    intermediate.children.set(oldRemaining[0]!, child);

    // Replace the child reference in the parent
    parent.children.set(firstChar, intermediate);

    // If there's more of the segment to insert, add it as a new child
    if (segRemaining.length > 0) {
      const newChild = new RadixNode(segRemaining);
      intermediate.children.set(segRemaining[0]!, newChild);
      this.insert(newChild, rest, handler);
    } else {
      this.insert(intermediate, rest, handler);
    }
  }

  /**
   * Handle the case where segment is longer than the common prefix.
   */
  private insertSplit(node: RadixNode, segment: string, rest: string[], handler: Handler, commonLen: number): void {
    // This happens when the new segment fully contains child's prefix
    // but has additional characters
    const segRemaining = segment.slice(commonLen);
    const newChild = new RadixNode(segRemaining);
    const firstChar = segRemaining[0]!;
    node.children.set(firstChar, newChild);
    this.insert(newChild, rest, handler);
  }

  /**
   * Look up a route by method and path.
   *
   * Returns `MatchResult` with handler and extracted params,
   * or `null` if no route matches.
   */
  lookup(method: HttpMethod, path: string): MatchResult | null {
    const root = this.trees.get(method);
    if (!root) return null;

    const segments = splitPath(path);
    const params: Record<string, string> = {};
    const handler = this.search(root, segments, params);
    if (!handler) return null;
    return { handler, params };
  }

  /**
   * Recursively search the radix tree for a matching handler.
   */
  private search(node: RadixNode, segments: string[], params: Record<string, string>): Handler | null {
    // No more segments — check for an exact handler
    if (segments.length === 0) {
      return node.handler;
    }

    const segment = segments[0]!;
    const rest = segments.slice(1);

    // Try static children first
    const firstChar = segment[0]!;
    const child = node.children.get(firstChar);
    if (child) {
      if (segment.startsWith(child.prefix)) {
        const remaining = segment.slice(child.prefix.length);
        if (remaining.length === 0) {
          const result = this.search(child, rest, params);
          if (result) return result;
        } else {
          // Segment extends beyond child's prefix — search deeper
          // by treating the remaining portion as an extra segment
          const result = this.search(child, [remaining, ...rest], params);
          if (result) return result;
        }
      }
    }

    // Try dynamic (:param) child
    if (node.paramChild) {
      params[node.paramChild.paramName!] = segment;
      const result = this.search(node.paramChild, rest, params);
      if (result) return result;
      // Clean up param if no match below
      delete params[node.paramChild.paramName!];
    }

    // Try wildcard
    if (node.wildcardHandler) {
      if (rest.length > 0) {
        params["*"] = `${segment}/${rest.join("/")}`;
      } else {
        params["*"] = segment;
      }
      return node.wildcardHandler;
    }

    return null;
  }
}

/**
 * Returns the length of the longest common prefix between two strings.
 */
function commonPrefixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return i;
}
