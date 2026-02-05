import { useState, useCallback } from 'react'
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project.types'
import { projectService } from '@/lib/projects'
import { useAuth } from '@/hooks/useAuth'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, token } = useAuth()

  const fetchProjects = useCallback(async (filters?: {
    category?: string
    minBudget?: number
    maxBudget?: number
    status?: string
    search?: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.getAllProjects(filters)
      setProjects(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchProjectById = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.getProjectById(id)
      setCurrentProject(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProject = useCallback(async (projectData: CreateProjectInput) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.createProject(projectData, token)
      setProjects(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const updateProject = useCallback(async (id: string, projectData: UpdateProjectInput) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.updateProject(id, projectData, token)
      setProjects(prev => prev.map(p => p.id === id ? data : p))
      if (currentProject?.id === id) {
        setCurrentProject(data)
      }
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token, currentProject])

  const deleteProject = useCallback(async (id: string) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      await projectService.deleteProject(id, token)
      setProjects(prev => prev.filter(p => p.id !== id))
      if (currentProject?.id === id) {
        setCurrentProject(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token, currentProject])

  const fetchUserProjects = useCallback(async () => {
    if (!user || !token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.getUserProjects(user.id, token)
      setProjects(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user projects')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user, token])

  const submitBid = useCallback(async (projectId: string, bidData: {
    amount: number
    description: string
    timeline: string
  }) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.submitBid(projectId, bidData, token)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bid')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const selectFreelancer = useCallback(async (projectId: string, freelancerId: string) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.selectFreelancer(projectId, freelancerId, token)
      setProjects(prev => prev.map(p => p.id === projectId ? data : p))
      if (currentProject?.id === projectId) {
        setCurrentProject(data)
      }
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select freelancer')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token, currentProject])

  const updateProjectStatus = useCallback(async (projectId: string, status: string) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.updateProjectStatus(projectId, status, token)
      setProjects(prev => prev.map(p => p.id === projectId ? data : p))
      if (currentProject?.id === projectId) {
        setCurrentProject(data)
      }
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project status')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token, currentProject])

  return {
    projects,
    currentProject,
    isLoading,
    error,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    fetchUserProjects,
    submitBid,
    selectFreelancer,
    updateProjectStatus,
    setCurrentProject,
    clearError: () => setError(null)
  }
}