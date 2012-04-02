/*
	Slidertron 0.2: A flexible slider plugin for jQuery
	By nodethirtythree design | http://nodethirtythree.com/
	Dual licensed under the MIT or GPL license.
	//////////////////////////////////////////////////////////////////////////
	MIT license:

	Copyright (c) 2010 nodethirtythree design, http://nodethirtythree.com/

	Permission is hereby granted, free of charge, to any person
	obtaining a copy of this software and associated documentation
	files (the "Software"), to deal in the Software without
	restriction, including without limitation the rights to use,
	copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following
	conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
	OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
	HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.
	//////////////////////////////////////////////////////////////////////////
	GPL license:

	Copyright (c) 2010 nodethirtythree design, http://nodethirtythree.com/
	
	This program is free software: you can redistribute it and/or modify it
	under the terms of the GNU General Public License as published by the Free 
	Software Foundation, either version 3 of the License, or (at your option) 
	any later version.

	This program is distributed in the hope that it will be useful, but 
	WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
	or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License 
	for more details.

	You should have received a copy of the GNU General Public License along 
	with this program. If not, see <http://www.gnu.org/licenses/>. 
	//////////////////////////////////////////////////////////////////////////
*/

(function($) {

	jQuery.fn.slidertron = function(options) {
		
		var settings = jQuery.extend({
			selectorParent:		jQuery(this)
		}, options);
		
		return jQuery.slidertron(settings);
	}

	jQuery.slidertron = function(options) {

		// Settings
		
			var settings = jQuery.extend({
			
				selectorParent:						null,						// If a jQuery object, all selectors will be restricted to its scope. Otherwise, all selectors will be global.
				
				// Selectors
				
					viewerSelector:					null,						// Viewer selector
					reelSelector:					null,						// Reel selector
					slidesSelector:					null,						// Slides selector
					indicatorSelector:				null,						// Indicator selector
					navNextSelector:				null,						// 'Next' selector
					navPreviousSelector:			null,						// 'Previous' selector
					navFirstSelector:				null,						// 'First' selector
					navLastSelector:				null,						// 'Last' selector
					navStopAdvanceSelector:			null,						// 'Stop Advance' selector
					navPlayAdvanceSelector:			null,						// 'Play Advance' selector
					linkSelector:					null,						// 'Link' selector

				// General settings

					speed:							'fast',						// Transition speed (0 for instant, 'slow', 'fast', or a custom duration in ms)
					navWrap:						true,						// Wrap navigation when we navigate past the first or last slide
					seamlessWrap:					true,						// Seamlessly wrap slides
					advanceDelay:					0,							// Time to wait (in ms) before automatically advancing to the next slide (0 disables advancement entirely)
					advanceResume:					0,							// Time to wait (in ms) before resuming advancement after a user interrupts it by manually navigating (0 disables resuming advancement)
					advanceNavActiveClass:			'active'					// Active advancement navigation class

			}, options);
			
		// Variables

			// Operational stuff
		
				var isConfigured = true,
					isLocked = false,
					isAdvancing = false,
					isSeamless = false,
					list = new Array(),
					currentIndex = false,
					timeoutID;

			// jQuery objects

				var __slides,
					__viewer,
					__indicator,
					__navFirst,
					__navLast,
					__navNext,
					__navPrevious,
					__navStopAdvance,
					__navPlayAdvance;

		// Functions
			
			function getElement(selector, required)
			{
				var x;
				
				try
				{
					if (selector == null)
						throw 'is undefined';
			
					if (settings.selectorParent)
						x = settings.selectorParent.find(selector);
					else
						x = jQuery(selector);
					
					if (x.length == 0)
						throw 'does not exist';
					
					return x;
				}
				catch (error)
				{
					if (required == true)
					{
						alert('Error: Required selector "' + selector + '" ' + error + '.');
						isConfigured = false;
					}
				}
				
				return null;
			}

			function advance()
			{
				if (settings.advanceDelay == 0)
					return;
			
				if (!isLocked)
					nextSlide();

				timeoutID = window.setTimeout(advance, settings.advanceDelay);
			}

			function initializeAdvance()
			{
				if (settings.advanceDelay == 0)
					return;

				if (__navPlayAdvance)
					__navPlayAdvance.addClass(settings.advanceNavActiveClass);
				
				if (__navStopAdvance)
					__navStopAdvance.removeClass(settings.advanceNavActiveClass);

				isAdvancing = true;
				timeoutID = window.setTimeout(advance, settings.advanceDelay);
			}
			
			function interruptAdvance()
			{
				if (!isAdvancing)
					return;

				if (settings.advanceDelay == 0)
					return;

				window.clearTimeout(timeoutID);

				if (settings.advanceResume == 0)
					return;

				timeoutID = window.setTimeout(advance, settings.advanceResume);
			}
			
			function stopAdvance()
			{
				if (settings.advanceDelay == 0)
					return;

				if (!isAdvancing)
					return;
			
				isAdvancing = false;
				window.clearTimeout(timeoutID);
			}
			
			function playAdvance(skip)
			{
				if (settings.advanceDelay == 0)
					return;

				if (isAdvancing)
					return;
					
				isAdvancing = true;

				if (skip)
					timeoutID = window.setTimeout(advance, settings.advanceDelay);
				else
					advance();
			}
			
			function firstSlide()
			{
				switchSlide((isSeamless ? 1 : 0));
			}
			
			function lastSlide()
			{
				switchSlide((isSeamless ? list.length - 2 : list.length - 1));
			}

			function nextSlide()
			{
				if (currentIndex < list.length - 1)
					switchSlide(currentIndex + 1);
				else if (settings.navWrap || isAdvancing)
					switchSlide(0);
			}
			
			function previousSlide()
			{
				if (currentIndex > 0)
					switchSlide(currentIndex - 1);
				else if (settings.navWrap)
					switchSlide(list.length - 1);
			}

			function switchSlide(index)
			{
				// Check locking status (so another switch can't be initiated while another is in progress)

				if (isLocked)
					return false;
					
				isLocked = true;

				if (currentIndex === false)
				{
					currentIndex = index;
					__reel.css('left', -1 * list[currentIndex].x);
					isLocked = false;

					if (__indicator)
					{
						__indicator.removeClass('active');
						$(__indicator.get(currentIndex - 1)).addClass('active');
					}

				}
				else
				{
					var diff, currentX, newX;
					
					currentX = list[currentIndex].x;
					newX = list[index].x;
					diff = currentX - newX;

					__reel.animate({ left: '+=' + diff }, settings.speed, 'swing', function() {
						currentIndex = index;

						if (list[currentIndex].realIndex !== false)
						{
							currentIndex = list[currentIndex].realIndex;
							__reel.css('left', -1 * list[currentIndex].x);
						}

						if (__indicator)
						{
							__indicator.removeClass('active');
							$(__indicator.get(currentIndex - 1)).addClass('active');
						}

						isLocked = false;
					});
				}
			}

			function initialize()
			{
				// Slides, viewer, reel, indicator

					__viewer = getElement(settings.viewerSelector, true);
					__reel = getElement(settings.reelSelector, true);
					__slides = getElement(settings.slidesSelector, true);
					__indicator = getElement(settings.indicatorSelector, false);

				// Navigation

					__navFirst = getElement(settings.navFirstSelector);
					__navLast = getElement(settings.navLastSelector);
					__navNext = getElement(settings.navNextSelector);
					__navPrevious = getElement(settings.navPreviousSelector);
					__navStopAdvance = getElement(settings.navStopAdvanceSelector);
					__navPlayAdvance = getElement(settings.navPlayAdvanceSelector);

				// Check configuration status
				
					if (__indicator)
					{
						if (__indicator.length != __slides.length)
						{
							alert('Error: Indicator needs to have as many items as there are slides.');
							return;
						}
					}
				
					if (isConfigured == false)
					{
						alert('Error: One or more configuration errors detected. Aborting.');
						return;
					}

				// Set up

					// Viewer
					
						__viewer.css('position', 'relative');
						__viewer.css('overflow', 'hidden');

					// Reel
					
						__reel.css('position', 'absolute');
						__reel.css('left', 0);
						__reel.css('top', 0);

					// Slides
				
						var cx = 0, length = __slides.length;
				
						if (length > 2 && settings.seamlessWrap)
						{
							isSeamless = true;

							var first = __slides.first();
							var last = __slides.last();
							
							last.clone().insertBefore(first);
							first.clone().insertAfter(last);

							__slides = getElement(settings.slidesSelector, true);
						}
						
						__slides.each(function(index) {

							var y = jQuery(this), href;

							var link = y.find(settings.linkSelector);
							
							if (link.length > 0)
							{
								href = link.attr('href');
								link.remove();
								y
									.css('cursor', 'pointer')
									.click(function(e) {
										window.location = href;
									});
							}

							list[index] = {
								object:		y,
								x:			cx,
								realIndex:	false
							};
							
							y.css('position', 'absolute');
							y.css('left', cx);
							y.css('top', 0);
							
							cx += y.width();
						});

						if (isSeamless)
						{
							list[0].realIndex = length; // second to last
							list[length + 1].realIndex = 1; // second
						}
					
					// Indicator
					
						if (__indicator)
						{
							__indicator.each(function() {
								var t = $(this);
								
								t
									.css('cursor', 'pointer')
									.click(function(event) {
										event.preventDefault();

										if (isLocked)
											return false;

										if (isAdvancing)
											interruptAdvance();

										switchSlide(t.index() + 1);
									});
							});
						}
					
					// Navigation

						if (__navFirst)
							__navFirst.click(function(event) {
								event.preventDefault();

								if (isLocked)
									return false;

								if (isAdvancing)
									interruptAdvance();
								
								firstSlide();
							});

						if (__navLast)
							__navLast.click(function(event) {
								event.preventDefault();

								if (isLocked)
									return false;

								if (isAdvancing)
									interruptAdvance();

								lastSlide();
							});

						if (__navNext)
							__navNext.click(function(event) {
								event.preventDefault();

								if (isLocked)
									return false;

								if (isAdvancing)
									interruptAdvance();

								nextSlide();
							});

						if (__navPrevious)
							__navPrevious.click(function(event) {
								event.preventDefault();

								if (isLocked)
									return false;
							
								if (isAdvancing)
									interruptAdvance();

								previousSlide();
							});

						if (__navStopAdvance)
							__navStopAdvance.click(function(event) {
								event.preventDefault();

								// Disruptive action, so no lock checking

								if (!isAdvancing)
									return false;

								__navStopAdvance.addClass(settings.advanceNavActiveClass);
								
								if (__navPlayAdvance)
									__navPlayAdvance.removeClass(settings.advanceNavActiveClass);

								stopAdvance();
							});

						if (__navPlayAdvance)
							__navPlayAdvance.click(function(event) {
								event.preventDefault();

								// Disruptive action, so no lock checking

								if (isAdvancing)
									return false;

								__navPlayAdvance.addClass(settings.advanceNavActiveClass);
								
								if (__navStopAdvance)
									__navStopAdvance.removeClass(settings.advanceNavActiveClass);

								playAdvance();
							});

			}

			// Ready

				jQuery().ready(function() {
					initialize();
					initializeAdvance();
					firstSlide();
				});
	};

})(jQuery);