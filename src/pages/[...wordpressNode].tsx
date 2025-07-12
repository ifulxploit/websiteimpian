import { getWordPressProps, WordPressTemplate } from '@faustwp/core'
import { GetStaticProps } from 'next'
import { WordPressTemplateProps } from '../types'
import { REVALIDATE_TIME } from '@/contains/contants'
import { IS_CHISNGHIAX_DEMO_SITE } from '@/contains/site-settings'

export default function Page(props: WordPressTemplateProps) {
	return <WordPressTemplate {...props} />
}

export async function myGetPaths() {
	try {
		const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/$/, '')

		if (!wpUrl) {
			console.error('[myGetPaths] NEXT_PUBLIC_WORDPRESS_URL is not defined')
			return []
		}

		const postRes = await fetch(`${wpUrl}/wp-json/wp/v2/posts?per_page=50&_fields=slug`)
		const catRes = await fetch(`${wpUrl}/wp-json/wp/v2/categories?per_page=20&_fields=slug`)

		if (!postRes.ok || !catRes.ok) {
			console.error(
				'[myGetPaths] Failed to fetch data:',
				`posts => ${postRes.status} ${postRes.statusText}`,
				`categories => ${catRes.status} ${catRes.statusText}`
			)
			return []
		}

		let posts = (await postRes.json()) as any[]
		let categories = (await catRes.json()) as any[]

		// Validasi isi array
		if (!Array.isArray(posts)) posts = []
		if (!Array.isArray(categories)) categories = []

		// Gabungkan slug kategori dan postingan
		const slugs = [
			...categories.map((category) => ({ slug: `category/${category.slug}` })),
			...posts.map((post) => ({ slug: post.slug })),
		]

		// Tambahkan halaman demo jika disetel
		if (IS_CHISNGHIAX_DEMO_SITE) {
			slugs.push(
				{ slug: 'home-2' },
				{ slug: 'home-3-podcast' },
				{ slug: 'home-4-video' },
				{ slug: 'home-5-gallery' },
				{ slug: 'home-6' },
				{ slug: 'search/posts/' }
			)
		}

		// Mapping slug ke parameter Next.js
		return slugs
			.filter((item) => typeof item.slug === 'string')
			.map((page) => ({
				params: { wordpressNode: [page.slug] },
			}))
	} catch (error) {
		console.error('[myGetPaths] Unexpected error:', error)
		return []
	}
}

export async function getStaticPaths() {
	const paths = await myGetPaths()

	return {
		paths,
		fallback: 'blocking',
	}
}

export const getStaticProps: GetStaticProps = (ctx) => {
	return getWordPressProps({ ctx, revalidate: REVALIDATE_TIME })
}
