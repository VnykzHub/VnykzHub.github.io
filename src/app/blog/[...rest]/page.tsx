import { notFound, redirect } from 'next/navigation'
import { findSeriesBySlug } from '@/content/series'

interface Props { params: Promise<{ rest: string[] }> }

export default async function BlogCatchAll({ params }: Props) {
  const { rest } = await params
  
  if (rest.length === 1) {
    const series = findSeriesBySlug(rest[0])
    if (series) {
      redirect(`/blog/${series.id}/${rest[0]}`)
    }
  }
  
  notFound()
}
