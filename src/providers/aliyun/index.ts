import { registerProvider } from '../../core/registry.js'

registerProvider({
  id: 'aliyun',
  title: '阿里云',
  color: '#ff6a00',
  enabledByDefault: false,
  fields: [
    { key: 'accessKeyId', label: 'AccessKeyId' },
    { key: 'accessKeySecret', label: 'AccessKeySecret', secret: true },
  ],
})
