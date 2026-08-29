import assert from 'node:assert/strict'
import test from 'node:test'
import { COS_SAFE_ERRORS } from '../providers/tencent/products/cos.js'
import { actionErrorMessage, publicErrorMessage } from '../core/safe-error.js'
import { TencentApiError } from '../providers/tencent/client.js'

test('publicErrorMessage keeps local hints and drops upstream / secrets', () => {
  assert.equal(publicErrorMessage(new Error('腾讯云 未配置 SecretId。请到设置页填写。')), '腾讯云 未配置 SecretId。请到设置页填写。')
  assert.equal(publicErrorMessage(new Error('缺少域名')), '缺少域名')
  assert.equal(
    publicErrorMessage(new Error('该域名未在 DNSPod 托管，不支持自动 DNS。请改用手动 DNS 或文件验证。')),
    '该域名未在 DNSPod 托管，不支持自动 DNS。请改用手动 DNS 或文件验证。',
  )
  assert.equal(
    publicErrorMessage(new Error('待验证证书不支持直接删除，须先取消审核')),
    '待验证证书不支持直接删除，须先取消审核',
  )
  assert.equal(publicErrorMessage(new Error('unknown method')), 'unknown method')
  assert.equal(publicErrorMessage('云厂商鉴权失败，请检查设置中的密钥'), '云厂商鉴权失败，请检查设置中的密钥')
})

test('publicErrorMessage maps vendor codes and never echoes secrets', () => {
  assert.equal(
    publicErrorMessage(new TencentApiError('SecretId is invalid', 'AuthFailure.SecretIdNotFound')),
    '云厂商鉴权失败，请检查设置中的密钥',
  )
  assert.equal(
    publicErrorMessage(new TencentApiError('account 12@foo.com has no CAM', 'UnauthorizedOperation')),
    '当前密钥没有该操作的权限',
  )
  assert.equal(publicErrorMessage(new Error('timeout 20000ms')), '云厂商请求超时')
  assert.equal(publicErrorMessage(new Error('HTTP 502')), '云厂商请求失败')
  assert.equal(
    publicErrorMessage(new TencentApiError('query syntax invalid', 'FailedOperation.SyntaxError')),
    '检索语句语法错误',
  )
  assert.doesNotMatch(publicErrorMessage(new Error('got AKIDabcdefghijklmnop')), /AKID/)
})

test('balance and register failures map to readable copy without secrets', () => {
  assert.equal(
    publicErrorMessage(new TencentApiError('balance not enough AKID12345678', 'ResourceInsufficient')),
    '账户余额不足',
  )
  assert.equal(
    publicErrorMessage(new TencentApiError('no money', 'FailedOperation.InsufficientBalance')),
    '账户余额不足',
  )
  assert.match(
    publicErrorMessage(new TencentApiError('register failed', 'FailedOperation.RegisterDomainFailed')),
    /账户余额不足|注册失败/,
  )
  assert.doesNotMatch(
    publicErrorMessage(new TencentApiError('got AKIDabcdefghijklmnop', 'FailedOperation.RegisterDomainFailed')),
    /AKID/,
  )
})

test('lock-related UnsupportedOperation codes stay readable without secrets', () => {
  assert.equal(
    publicErrorMessage(new TencentApiError('lock on AKID12345678', 'UnsupportedOperation.DomainUpdateProhibitionLockStartOn')),
    '更新锁已开，不能改转移锁',
  )
  assert.equal(
    publicErrorMessage(new TencentApiError('cannot modify', 'UnsupportedOperation.ModifyDomainInfoOperateUnsupported')),
    '当前域名状态不支持该操作',
  )
  assert.doesNotMatch(
    publicErrorMessage(new TencentApiError('got AKIDabcdefghijklmnop', 'UnsupportedOperation.DomainUpdateProhibitionLockStartOn')),
    /AKID/,
  )
})

test('actionErrorMessage keeps module business copy for the HTTP 400 path', () => {
  assert.equal(actionErrorMessage('未勾选协议，不能提交订单'), '未勾选协议，不能提交订单')
  assert.equal(actionErrorMessage('购物车为空，不能提交订单'), '购物车为空，不能提交订单')
  assert.equal(actionErrorMessage('hot.xyz 是溢价词，不可加购'), 'hot.xyz 是溢价词，不可加购')
  assert.equal(actionErrorMessage('taken.cn 已被注册'), 'taken.cn 已被注册')
  assert.equal(actionErrorMessage('更新锁已开，不能改转移锁'), '更新锁已开，不能改转移锁')
  assert.equal(actionErrorMessage('账户余额不足'), '账户余额不足')
  assert.equal(actionErrorMessage('时长最多 10 年'), '时长最多 10 年')
  assert.equal(actionErrorMessage(new Error('HTTP 502')), '云厂商请求失败')
  assert.equal(
    actionErrorMessage(new TencentApiError('SecretId is invalid', 'AuthFailure.SecretIdNotFound')),
    '云厂商鉴权失败，请检查设置中的密钥',
  )
  assert.doesNotMatch(actionErrorMessage(new Error('got AKIDabcdefghijklmnop')), /AKID/)
})

test('g2.3 publicErrorMessage keeps COS rename/folder-delete local hints', () => {
  assert.equal(
    publicErrorMessage('已复制到新名称，但源对象删除失败，请手动删除源文件'),
    '已复制到新名称，但源对象删除失败，请手动删除源文件',
  )
  assert.equal(
    publicErrorMessage('已删除 1 个对象，剩余 2 个未删尽，请重试'),
    '已删除 1 个对象，剩余 2 个未删尽，请重试',
  )
  for (const message of COS_SAFE_ERRORS) {
    assert.equal(publicErrorMessage(message), message, message)
  }
})
