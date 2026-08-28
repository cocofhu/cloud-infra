import { registerProvider } from '../../core/registry.js'
import './products/domain.js'

registerProvider({
  id: 'tencent',
  title: '腾讯云',
  color: '#2d8cf0',
  enabledByDefault: true,
  fields: [
    { key: 'secretId', label: 'SecretId', placeholder: 'AKIDxxxxxxxx' },
    { key: 'secretKey', label: 'SecretKey', secret: true },
  ],
})
