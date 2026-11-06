import { describe, it, expect } from 'vitest'
import { createProjectSchema, createTaskSchema, updateTaskSchema } from './index'

describe('validation schemas', () => {
  it('validates createProjectSchema', () => {
    const result = createProjectSchema.safeParse({ name: 'Test Project' })
    expect(result.success).toBe(true)
  })

  it('rejects empty project name', () => {
    const result = createProjectSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('validates createTaskSchema', () => {
    const result = createTaskSchema.safeParse({ projectId: 'e7a62cda-6db8-5a45-8b42-2f9e1c7d8a43', title: 'Task' })
    expect(result.success).toBe(true)
  })

  it('validates updateTaskSchema with partial data', () => {
    const result = updateTaskSchema.safeParse({ status: 'done' })
    expect(result.success).toBe(true)
  })
})
