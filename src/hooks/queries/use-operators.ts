import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repositoryFactory } from '@/data/repositories/repository.factory'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'

export const operatorKeys = {
  all: ['operators'] as const,
  lists: () => [...operatorKeys.all, 'list'] as const,
}

export function useOperators() {
  return useQuery({
    queryKey: operatorKeys.lists(),
    queryFn: async () => {
      const repo = repositoryFactory.getOperatorRepository()
      const result = await repo.getAll()
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateOperator() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado')
      }

      const repo = repositoryFactory.getOperatorRepository()
      const result = await repo.getOrCreate(data.name, user.id)
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operatorKeys.all })
      toast({
        title: 'Operador agregado',
        description: 'El operador se ha añadido correctamente.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useSearchOperators() {
  return useMutation({
    mutationFn: async (term: string) => {
      const repo = repositoryFactory.getOperatorRepository()
      const result = await repo.search(term)
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
  })
}
