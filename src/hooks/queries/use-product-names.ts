import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repositoryFactory } from '@/data/repositories/repository.factory'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'

export const productNameKeys = {
  all: ['productNames'] as const,
  lists: () => [...productNameKeys.all, 'list'] as const,
}

export function useProductNames() {
  return useQuery({
    queryKey: productNameKeys.lists(),
    queryFn: async () => {
      const repo = repositoryFactory.getProductNameRepository()
      const result = await repo.getAll()
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateProductName() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado')
      }

      const repo = repositoryFactory.getProductNameRepository()
      const result = await repo.getOrCreate(
        data.name,
        user.id,
        data.description,
      )
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productNameKeys.all })
      toast({
        title: 'Nombre de producto agregado',
        description: 'El nombre de producto se ha añadido correctamente.',
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

export function useSearchProductNames() {
  return useMutation({
    mutationFn: async (term: string) => {
      const repo = repositoryFactory.getProductNameRepository()
      const result = await repo.search(term)
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
  })
}
