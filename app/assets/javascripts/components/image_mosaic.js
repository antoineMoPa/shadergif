Vue.component(
	'image-mosaic',
	{
		template: `
			<div class="image-mosaic">
				<template v-for='gif in gifs'>
					<a class="image-mosaic-link" v-bind:href='"/gifs/" + gif.id'>
						<img v-bind:src='"/gifs/generated/" + gif.image_filename + "-small.gif"'>
					</a>
				</template>
			</div>
		`,
		props: ["gifs"],
		methods: {
		}
	}
);
