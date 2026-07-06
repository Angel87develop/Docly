import type { FolderTreeNode, LibraryFolder } from '@/types'

export function buildFolderTree(folders: LibraryFolder[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>()
  for (const f of folders) {
    map.set(f.id, { ...f, children: [] })
  }
  const roots: FolderTreeNode[] = []
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortRecursive = (nodes: FolderTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    for (const n of nodes) sortRecursive(n.children)
  }
  sortRecursive(roots)
  return roots
}
