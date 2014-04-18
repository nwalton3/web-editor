'use strict'
path = require('path')
# lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet

folderMount = (connect, point) ->
	return connect.static(path.resolve(point))

checkForModifiedImports = (grunt, path, time, include) ->
	# contents = grunt.file.read path
	include true

module.exports = (grunt) ->

	grunt.initConfig
		pkg: grunt.file.readJSON('package.json')

		uglify:
			options:
				mangle: false
				preserveComments: 'some'
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %>  */'
				beautify: true
				sourceMap: '<%= local %>'
			script:
				files:
					'js/script.min.js' : [
						'js/libs/jquery.min.js',
						'js/bootstrap.js',
						'js/libs/rangy.min.js',
						'js/plugins/rangy-saverestore.min.js',
						'js/plugins/typogr.js',
						'js/script.js']
			touch:
				files:
					'js/script-touch.min.js' : [
						'js/libs/jquery.min.js',
						'js/bootstrap.js',
						'js/libs/rangy.min.js',
						'js/plugins/rangy-saverestore.min.js',
						'js/plugins/typogr.js',
						'js/plugins/touchswipe.js',
						'js/touch.js',
						'js/script.js']
			init:
				files:
					'js/init.min.js' : [
						'js/libs/modernizr.min.js',
						'js/init.js']

		jshint:
			options:
				"camelcase" : false
				"es3" : false
				"trailing" : false
				"white" : false
				"smarttabs" : true
				"jquery" : true
				"browser" : true
				"expr" : false
			files:[
				'js/init.js',
				'js/touch.js',
				'js/script.js'
				]

		coffee:
			files:
				expand: true
				flatten: true
				cwd: 'coffee/'
				src: ['*.coffee']
				dest: 'js/'
				ext: '.js'

		bootstrap:
			dest: ''
			js: [
				'bootstrap-transition.js',
				'bootstrap-modal.js',
				'bootstrap-dropdown.js',
				#'bootstrap-scrollspy.js',
				#'bootstrap-tab.js',
				#'bootstrap-tooltip.js',
				#'bootstrap-popover.js',
				#'bootstrap-affix.js',
				#'bootstrap-alert.js',
				#'bootstrap-button.js',
				#'bootstrap-collapse.js',
				#'bootstrap-carousel.js',
				#'bootstrap-typeahead.js',
				]
			css: []

		sass:
			options:
				compass: 'config.rb'
				style: 'compressed'
				debugInfo: '<%= local %>'
				trace:     '<%= local %>'
				sourcemap: '<%= local %>'
				includePaths: []
			files:
				expand: true
				cwd: 'sass/'
				src: ['*.sass', '*.scss', '!_*.sass', '!_*.scss']
				dest: 'css/'
				ext: '.css'


		autoprefixer:
			options:
				map: '<%= local %>'
				browsers: ['last 4 versions', '> 1%']
			files: 
				src: 'css/*.css'


		jade:
			options:
				pretty: true
			files:
				expand: true
				cwd: 'jade/'
				src: ['*.html.jade']
				dest: ''
				ext: '.html'

		yaml:
			options:
				space: 2
			files:
				expand: true
				cwd: ''
				src: ['data/**/*.yaml']
				dest: 'data/'
				ext: '.json'

		newer:
			options:
				override: (detail, include) ->
					if detail.task is 'sass' or detail.task is 'jade'
						include true
						# checkForModifiedImports grunt, detail.path, detail.time, include
					else
						include false

		watch:
			options:
				spawn: false
			sass:
				files: ['sass/**/*.sass', 'sass/**/*.scss']
				tasks: ['newer:sass']
			css:
				options:
					livereload: true
				files: ['css/**/*']
				tasks: ['newer:autoprefixer']
			jade:
				options:
					livereload: true
				files: ['jade/**/*.jade']
				tasks: ['newer:jade']
			coffee:
				options:
					livereload: true
				files: ['coffee/*.coffee']
				tasks: ['coffee', 'newer:jshint', 'newer:uglify']
			js:
				files: ['js/bootstrap.js']
				tasks: ['newer:jshint', 'newer:uglify']
			yaml:
				files: ['data/**/*.yml']
				tasks: ['newer:yaml']
			livereload:
				options:
					livereload: true
				files: ['img/*', 'js/*.min.js']


		connect:
			server:
				options:
					port: 9001



	require('load-grunt-tasks')(grunt);

	# Environments
	
	local = grunt.option('local') || true
	grunt.registerTask( 'setLocal', 'Local is true', () -> local = true )
	grunt.registerTask( 'setLocal', 'Local is true', () -> local = false )
	grunt.registerTask('local',  ['setLocal',  'compile'])
	grunt.registerTask('prod',  ['setProd',  'compile'])

	# Default task(s).
	grunt.registerTask('compile', ['sass', 'autoprefixer', 'jade', 'coffee', 'jshint', 'uglify', 'yaml'])
	grunt.registerTask('default', ['connect', 'watch'])
