/**
 * Author		jssoscar
 * Date			2013-10-15 14:30:26
 * Description	jQuery plugin for slider
 * Since		1.0

 * Version		1.0.1
 * Update		2013-10-16 10:44:21
 * Note			. Fixed the bug for mouseout event
 * 				. Fixed the bug for the clone first li node
 * 				. Optimize the code for find the ul node
 *
 * Version		1.0.2
 * Update		2013-10-21 11:03:45
 * Note			. Add the slider animation mode : default is animation mode
 * 				. Support 3 kinds of mode : animate,show,fade
 * 				. Fixed the bug
 * 				. Optimize the code
 */
$.fn.slider = function(config) {
	// The slider default configuration
	var Slider = {
		DIRECTIONS : {
			"L" : "left",
			"T" : "top"
		},
		EVENTS : {
			"C" : "click",
			"M" : "mouseover",
			"O" : "mouseout"
		},
		MODES : {
			"A" : "animate",
			"S" : "show",
			"F" : "fade"
		}
	}, defaultCfg = {
		direction : Slider.DIRECTIONS.L,
		auto : true,
		interval : 5,
		speed : 1,
		cycle : true,
		callback : null,
		rollMult : 1,
		nav : false,
		navContainer : null,
		eventType : Slider.EVENTS.C,
		currentNavClass : null,
		mode : Slider.MODES.A
	};

	// The slider configuration
	var options = extendConfig(defaultCfg, config);

	// Handler for the slider plugin
	this.each(function() {
		var _this = $(this), ul = _this.find("ul:eq(0)"), li = _this.find("ul:eq(0) > li"), sliderController = {
			count : 0,
			li_length : li.length,
			li_width : li.width(),
			li_height : li.height(),
			slider : null,
			sliderFinished : true
		};

		// If the slider only has one "li" slider node , do nothing
		if (sliderController.li_length <= 1) {
			return;
		}

		// Calculate the slider parent node width and height attribute
		calculateSliderAttr(ul, options, sliderController);

		// Generate navigator content
		if (options.nav) {
			if (options.navContainer && options.navContainer[0]) {
				var navContent = [];
				for (var i = 0; i < sliderController.li_length; i++) {
					if (i === 0 && options.currentNavClass != null) {
						navContent[i] = "<a href='javascript:void(0);' class='" + options.currentNavClass + "'>" + (i + 1) + "</a>";
						continue;
					}
					navContent[i] = "<a href='javascript:void(0);'>" + (i + 1) + "</a>";
				}
				options.navContainer.html(navContent.join(""));
				if (mouseoverEvent(options)) {
					options.navContainer.find("a").bind({
						"mouseover" : function() {
							updateNavButton($(this), _this, sliderController);
						},
						"mouseout" : function() {
							startSlider(_this, sliderController);
						}
					});
				} else if (clickEvent(options)) {
					options.navContainer.find("a").bind({
						"click" : function(){
							updateNavButton($(this), _this, sliderController);
						},
						"mouseout" : function() {
							startSlider(_this, sliderController);
						}
					});
				}
			}
		}
		startSlider(_this, sliderController);
	});

	/**
	 * Extend the config information.Mainly contains the following:
	 * .	Deal with the animate interval
	 * .	Deal with the slider direction
	 * .	Deal with the slider navigator button event handler
	 *
	 * @param {Object} defaultCfg : slider default config
	 * @param {Object} config : customer config
	 */
	function extendConfig(defaultCfg, config) {
		var options = $.extend(defaultCfg, config);

		// Deal with the animate interval
		if (options.speed >= options.interval) {
			options.interval = 5;
			options.speed = 1;
		}
		options.interval = options.interval * 1e3;
		options.speed = options.speed * 1e3;

		// Deal with the slider direction
		if (!slide2Left(options) && !slide2Top(options)) {
			options.direction = Slider.DIRECTIONS.L;
		}

		// Deal with the slider navigator button event handler
		if (!clickEvent(options) && !mouseoverEvent(options)) {
			options.eventType = Slider.EVENTS.C;
		}

		// Deal with the slider animation effect
		if (!animateEffect(options) && !showEffect(options) && !fadeEffect(options)) {
			options.mode = Slider.MODES.A;
		}
		return options;
	}

	/**
	 * Calculate the slider node height and width attribute
	 *
	 * @param {Object} ul : the ul node
	 * @param {Object} options : the slider parameter configuration
	 * @param {Object} sliderController : the slider controller
	 */
	function calculateSliderAttr(ul, options, sliderController) {
		if (animateEffect(options)) {
			if (slide2Left(options)) {
				ul.width((sliderController.li_length + 1) * sliderController.li_width).height(sliderController.li_height);
			} else if (slide2Top(options)) {
				ul.width(sliderController.li_width).height((sliderController.li_length + 1) * sliderController.li_height);
			}
		} else if (showEffect(options) || fadeEffect(options)) {
			ul.width(sliderController.li_width).height(sliderController.li_height);
		}
	}

	/**
	 * Start the slider : start to animate the DOM element
	 *
	 * @param {Object} obj : the DOM element for slide
	 * @param {Object} sliderController : the slider controller
	 */
	function startSlider(obj, sliderController) {
		sliderController.slider = setInterval(function() {
			sliderController.count++;
			autoSlide(obj, sliderController);
		}, options.interval);
	}

	/**
	 * Slide automatically
	 * .	Animate the slider block
	 * .	Switch the navigator button if it exists
	 *
	 * @param {Object} obj : the slider object
	 * @param {Object} sliderController : the slider controller
	 */
	function autoSlide(obj, sliderController) {
		sliderController.sliderFinished = false;
		if (animateEffect(options)) {
			var autoCss = {}, direction = 'margin-' + options.direction;
			autoCss[direction] = getMarginPosition(sliderController);
			obj.find("ul").animate(autoCss, options.speed, function() {
				sliderController.sliderFinished = true;
				if (options.cycle && sliderController.count === sliderController.li_length) {
					sliderController.count = 0;
					$(this).css(direction, "0");
				}
				if (options.nav) {
					options.navContainer.find("a:eq(" + sliderController.count + ")").addClass(options.currentNavClass).siblings().removeClass(options.currentNavClass);
				}
			});
		} else if (showEffect(options)) {
			effectController(options, sliderController);
			obj.find("ul:eq(0) > li:eq(" + sliderController.count + ")").show(options.speed, function() {
				sliderController.sliderFinished = true;
			}).siblings().hide();
		} else if (fadeEffect(options)) {
			effectController(options, sliderController);
			obj.find("ul:eq(0) > li:eq(" + sliderController.count + ")").fadeIn(options.speed, function() {
				sliderController.sliderFinished = true;
			}).siblings().hide();
		}
	}
	
	/**
	 * Slider effect controller for the show and fade mode animation
	 * 
	 * @param {Object} options : the slider parameter configuration
	 * @param {Object} sliderController : the slider controller
	 */
	function effectController(options, sliderController) {
		if (sliderController.count === sliderController.li_length) {
			sliderController.count = 0;
		}
		if (options.nav) {
			options.navContainer.find("a:eq(" + sliderController.count + ")").addClass(options.currentNavClass).siblings().removeClass(options.currentNavClass);
		}
	}

	/**
	 * Stop slider : clear the slider interval
	 *
	 * @param {Object} sliderController : the slider controller
	 */
	function stopSlider(sliderController) {
		clearInterval(sliderController.slider);
	}

	/**
	 * Judgement for whether the slider scroll to left
	 *
	 * @param {Object} options : the slider parameter configuration
	 */
	function slide2Left(options) {
		return options.direction === Slider.DIRECTIONS.L;
	}

	/**
	 * Judgement for whether the slider scroll to top
	 *
	 * @param {Object} options : the slider parameter configuration
	 */
	function slide2Top(options) {
		return options.direction === Slider.DIRECTIONS.T;
	}

	/**
	 * Navigator button click event handler
	 *
	 * @param {Object} options : the slider parameter configuration
	 */
	function clickEvent(options) {
		return options.eventType === Slider.EVENTS.C;
	}

	/**
	 * Navigator button mouseover event handler
	 *
	 * @param {Object} options : the slider parameter configuration
	 */
	function mouseoverEvent(options) {
		return options.eventType === Slider.EVENTS.M;
	}

	/**
	 * Slider effect : aminate effect
	 *
	 * @param {Object} options : the slider parameter configuration
	 */
	function animateEffect(options) {
		return options.mode === Slider.MODES.A;
	}

	/**
	 * Slider effect : show && hide slider
	 *
	 * @param {Object} options : the slider parameter configuration
	 */
	function showEffect(options) {
		return options.mode === Slider.MODES.S;
	}

	/**
	 * Slider effect : fadeIn && fadeOut slider
	 *
	 * @param {Object} options : the slider parameter configuration
	 */
	function fadeEffect(options) {
		return options.mode === Slider.MODES.F;
	}

	/**
	 * Update the navigator buton status
	 *
	 * @param {Object} currentNavBtn : current navigator button
	 * @param {Object} root : the root DOM element.Here,it's the caller element.
	 * @param {Object} sliderController : the slider controller
	 */
	function updateNavButton(currentNavBtn, root, sliderController) {
		stopSlider(sliderController);
		if (sliderController.sliderFinished) {
			sliderController.count = currentNavBtn.index();
			autoSlide(root, sliderController);
		}
	}

	/**
	 * Get slider margin position : acoording to the slider direction , get margin-left value or margin-top value
	 *
	 * @param {Object} options : the slider config options
	 * @param {Object} sliderController : slider controller
	 */
	function getMarginPosition(sliderController) {
		if (slide2Left(options)) {
			return -sliderController.li_width * options.rollMult * sliderController.count;
		} else if (slide2Top(options)) {
			return -sliderController.li_height * options.rollMult * sliderController.count;
		}
	}
};