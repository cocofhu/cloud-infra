import assert from 'node:assert/strict'
import test from 'node:test'
import { createTkeModule, type TkeClusterItem } from '../providers/tencent/products/tke.js'

// 回归:g2 审查发现的 TKE 删除保护 fail-open 问题
// - loadCluster 三路查询全部失败时不得报「资源不存在」,要上抛真实错误
// - deleteCluster 在集群信息/节点数量无法确认时必须拒绝删除(fail-closed)

function ctx(extra: Record<string, unknown> = {}) {
  return {
    creds: { secretId: 'id', secretKey: 'key' },
    query: '',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    region: 'ap-guangzhou',
    ...extra,
  }
}

test('loadCluster 三路真实错误时上抛真实错误而非「资源不存在」', async () => {
  const call = async (action: string) => {
    if (action === 'DescribeClusters' || action === 'DescribeEKSClusters' || action === 'DescribeTKEEdgeClusters') {
      const err = new Error('AuthFailure: 密钥错误')
      ;(err as { code?: string }).code = 'AuthFailure'
      throw err
    }
    throw new Error(`unexpected ${action}`)
  }
  const module = createTkeModule(call as never)
  const result = await module.execute?.('cluster.delete', { riskAck: true }, ctx({ id: 'tencent.tke:ap-guangzhou:cls-x1' }))
  assert.equal(result?.ok, false)
  // fail-closed:不能误报「资源不存在」而放行;必须明确阻止删除
  assert.match(String(result && 'error' in result ? result.error : ''), /无法确认集群信息/)
})

test('deleteCluster 节点数量查询失败时拒绝删除(fail-closed)', async () => {
  const cluster: TkeClusterItem = { ClusterId: 'cls-ok1', ClusterName: 'ok', ClusterNodeNum: 0, DeletionProtection: false }
  const call = async (action: string) => {
    if (action === 'DescribeClusters') return { Clusters: [cluster], TotalCount: 1 }
    if (action === 'DescribeClusterInstances') {
      const err = new Error('InternalError: 上游抖动')
      ;(err as { code?: string }).code = 'InternalError'
      throw err
    }
    throw new Error(`unexpected ${action}`)
  }
  const module = createTkeModule(call as never)
  const result = await module.execute?.('cluster.delete', { riskAck: true, instanceDeleteMode: 'retain' }, ctx({ id: 'tencent.tke:ap-guangzhou:cls-ok1' }))
  assert.equal(result?.ok, false)
  assert.match(String(result && 'error' in result ? result.error : ''), /无法确认节点数量/)
})

test('deleteCluster 集群与节点均可查时按原逻辑放行空集群', async () => {
  const cluster: TkeClusterItem = { ClusterId: 'cls-ok2', ClusterName: 'ok', ClusterNodeNum: 0, DeletionProtection: false }
  const calls: string[] = []
  const call = async (action: string) => {
    calls.push(action)
    if (action === 'DescribeClusters') return { Clusters: [cluster], TotalCount: 1 }
    if (action === 'DescribeClusterInstances') return { InstanceSet: [], TotalCount: 0 }
    if (action === 'DeleteCluster') return {}
    throw new Error(`unexpected ${action}`)
  }
  const module = createTkeModule(call as never)
  const result = await module.execute?.('cluster.delete', { riskAck: true, instanceDeleteMode: 'retain' }, ctx({ id: 'tencent.tke:ap-guangzhou:cls-ok2' }))
  assert.equal(result?.ok, true)
  assert.ok(calls.includes('DeleteCluster'))
})
