import assert from 'node:assert/strict'
import test from 'node:test'
import { publicErrorMessage } from '../core/safe-error.js'
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
  assert.doesNotMatch(publicErrorMessage(new Error('got AKIDabcdefghijklmnop')), /AKID/)
})
