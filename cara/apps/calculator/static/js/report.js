/* Generate the concentration plot using d3 library. */
function draw_concentration_plot(svg_id, times, concentrations, cumulative_doses, exposed_presence_intervals) {
    var visBoundingBox = d3.select(svg_id)
        .node()
        .getBoundingClientRect();

    var time_format = d3.timeFormat('%H:%M');

    var data = []
    times.map((time, index) => data.push({ 'time': time, 'hour': new Date().setHours(Math.trunc(time), (time - Math.trunc(time)) * 60), 'concentration': concentrations[index], 'cumulative_doses': cumulative_doses[index] }))

    var vis = d3.select(svg_id),
        width = visBoundingBox.width - 400,
        height = visBoundingBox.height,
        margins = { top: 30, right: 20, bottom: 50, left: 50 },

        // H:M time format for x axis.
        xRange = d3.scaleTime().range([margins.left, width - margins.right]).domain([data[0].hour, data[data.length - 1].hour]),
        xTimeRange = d3.scaleLinear().range([margins.left, width - margins.right]).domain([data[0].time, data[data.length - 1].time]),
        bisecHour = d3.bisector((d) => { return d.hour; }).left,

        yRange = d3.scaleLinear().range([height - margins.bottom, margins.top]).domain([0., Math.max(...concentrations)]),
        yCumulatedRange = d3.scaleLinear().range([height - margins.bottom, margins.top]).domain([0., Math.max(...cumulative_doses)]),

        xAxis = d3.axisBottom(xRange).tickFormat(d => time_format(d)),
        yAxis = d3.axisLeft(yRange),
        yCumulatedAxis = d3.axisRight(yCumulatedRange);

    // Plot tittle.
    plot_title(vis, width, margins.top, 'Mean concentration of virions');

    // Line representing the mean concentration.
    plot_scenario_data(vis, data, xTimeRange, yRange, '#1f77b4');
    // Line representing the cumulative concentration.
    plot_cumulative_data(vis, data, xTimeRange, yCumulatedRange, '#1f77b4');

    // X axis.
    plot_x_axis(vis, height, width, margins, xAxis, 'Time of day');

    // Y axis
    plot_y_axis(vis, height, width, margins, yAxis, 'Mean concentration (virions/m³)')

    // Y cumulative concentration axis declaration.
    vis.append('svg:g')
        .attr('class', 'y axis')
        .style("stroke-dasharray", "5 5")
        .attr('transform', 'translate(' + (width - margins.right) + ',0)')
        .call(yCumulatedAxis);

    // Y cumulated concentration axis label.
    vis.append('svg:text')
        .attr('class', 'y label')
        .attr('fill', 'black')
        .attr('transform', 'rotate(-90, 0,' + height + ')')
        .attr('text-anchor', 'middle')
        .attr('x', (height + margins.bottom) / 2)
        .attr('y', 1.71 * width)
        .text('Mean cumulative dose (virions)');

    // Area representing the presence of exposed person(s).
    exposed_presence_intervals.forEach(b => {
        var curveFunc = d3.area()
            .x(d => xTimeRange(d.time))
            .y0(height - margins.bottom)
            .y1(d => yRange(d.concentration));

        vis.append('svg:path')
            .attr('d', curveFunc(data.filter(d => {
                return d.time >= b[0] && d.time <= b[1]
            })))
            .attr('fill', '#1f77b4')
            .attr('fill-opacity', '0.1');
    })

    // Legend for the plot elements - line and area.
    var size = 20
    vis.append('rect')
        .attr('x', width + size + 50)
        .attr('y', margins.top + size)
        .attr('width', 20)
        .attr('height', 3)
        .style('fill', '#1f77b4');

    vis.append('rect')
        .attr('x', width + size + 50)
        .attr('y', 3 * size)
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', '#1f77b4')
        .attr('fill-opacity', '0.1');

    vis.append('line')
        .attr("x1", width + size + 50)
        .attr("x2", width + 2 * size + 52)
        .attr("y1", margins.top + 3.1 * size)
        .attr("y2", margins.top + 3.1 * size)
        .style("stroke-dasharray", "5 5") //dashed array for line
        .attr('stroke-width', '2')
        .style("stroke", '#1f77b4');

    vis.append('text')
        .attr('x', width + 3 * size + 50)
        .attr('y', margins.top + size)
        .text('Mean concentration')
        .style('font-size', '15px')
        .attr('alignment-baseline', 'central');

    vis.append('text')
        .attr('x', width + 3 * size + 50)
        .attr('y', margins.top + 2 * size)
        .text('Presence of exposed person(s)')
        .style('font-size', '15px')
        .attr('alignment-baseline', 'central');

    vis.append('text')
        .attr('x', width + 3 * size + 50)
        .attr('y', margins.top + 3 * size)
        .text('Mean viral concentration')
        .style('font-size', '15px')
        .attr('alignment-baseline', 'central');

    // Legend bounding box.
    vis.append('rect')
        .attr('width', 270)
        .attr('height', 70)
        .attr('x', width * 1.1)
        .attr('y', margins.top + 5)
        .attr('stroke', 'lightgrey')
        .attr('stroke-width', '2')
        .attr('rx', '5px')
        .attr('ry', '5px')
        .attr('stroke-linejoin', 'round')
        .attr('fill', 'none');

    // Tooltip.
    var focus = vis.append('svg:g')
        .style('display', 'none');

    focus.append('circle')
        .attr('r', 3);

    focus.append('rect')
        .attr('fill', 'white')
        .attr('stroke', '#000')
        .attr('width', 85)
        .attr('height', 50)
        .attr('x', 10)
        .attr('y', -22)
        .attr('rx', 4)
        .attr('ry', 4);

    focus.append('text')
        .attr('id', 'tooltip-time')
        .attr('x', 18)
        .attr('y', -2);

    focus.append('text')
        .attr('id', 'tooltip-concentration')
        .attr('x', 18)
        .attr('y', 18);

    vis.append('rect')
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .attr('width', width - margins.right)
        .attr('height', height)
        .on('mouseover', () => { focus.style('display', null); })
        .on('mouseout', () => { focus.style('display', 'none'); })
        .on('mousemove', mousemove);

    function mousemove() {
        var x0 = xRange.invert(d3.pointer(event, this)[0]),
            i = bisecHour(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.hour > d1.hour - x0 ? d1 : d0;
        focus.attr('transform', 'translate(' + xRange(d.hour) + ',' + yRange(d.concentration) + ')');
        focus.select('#tooltip-time').text('x = ' + time_format(d.hour));
        focus.select('#tooltip-concentration').text('y = ' + d.concentration.toFixed(2));
    }
}

// Generate the alternative scenarios plot using d3 library.
// 'alternative_scenarios' is a dictionary with all the alternative scenarios 
// 'times' is a list of times for all the scenarios
function draw_alternative_scenarios_plot(svg_id, width, height, alternative_scenarios, times) {
     // H:M format
    var time_format = d3.timeFormat('%H:%M');
    // D3 array of ten categorical colors represented as RGB hexadecimal strings.
    var colors = d3.schemeAccent;

    // Variable for the highest concentration for all the scenarios
    var highest_concentration = 0.

    var data_for_scenarios = {}
    for (scenario in alternative_scenarios) {
        scenario_concentrations = alternative_scenarios[scenario].concentrations

        highest_concentration = Math.max(highest_concentration, Math.max(...scenario_concentrations))

        var data = []
        times.map((time, index) => data.push({ 'time': time, 'hour': new Date().setHours(Math.trunc(time), (time - Math.trunc(time)) * 60), 'concentration': scenario_concentrations[index] }))

        // Add data into lines dictionary
        data_for_scenarios[scenario] = data
    }

    // We need one scenario to get the time range
    var first_scenario = Object.values(data_for_scenarios)[0]

    var vis = d3.select(svg_id),
        width = width,
        height = height,
        margins = { top: 30, right: 20, bottom: 50, left: 50 },

        // H:M time format for x axis.
        xRange = d3.scaleTime().range([margins.left, width - margins.right]).domain([first_scenario[0].hour, first_scenario[first_scenario.length - 1].hour]),
        xTimeRange = d3.scaleLinear().range([margins.left, width - margins.right]).domain([times[0], times[times.length - 1]]),

        yRange = d3.scaleLinear().range([height - margins.bottom, margins.top]).domain([0., highest_concentration]),

        xAxis = d3.axisBottom(xRange).tickFormat(d => time_format(d)),
        yAxis = d3.axisLeft(yRange);

    // Plot title.
    plot_title(vis, width, margins.top, 'Mean concentration of virions');

    // Line representing the mean concentration for each scenario.
    for (const [scenario_name, data] of Object.entries(data_for_scenarios)) {
        var scenario_index = Object.keys(data_for_scenarios).indexOf(scenario_name)

        // Line representing the mean concentration.
        plot_scenario_data(vis, data, xTimeRange, yRange, colors[scenario_index])

        // Legend for the plot elements - lines.
        var size = 20 * (scenario_index + 1)
        vis.append('rect')
            .attr('x', width + 20)
            .attr('y', margins.top + size)
            .attr('width', 20)
            .attr('height', 3)
            .style('fill', colors[scenario_index]);

        vis.append('text')
            .attr('x', width + 3 * 20)
            .attr('y', margins.top + size)
            .text(scenario_name)
            .style('font-size', '15px')
            .attr('alignment-baseline', 'central');

    }

    // X axis.
    plot_x_axis(vis, height, width, margins, xAxis, "Time of day");

    // Y axis declaration.
    vis.append('svg:g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + margins.left + ',0)')
        .call(yAxis);

    // Y axis label.
    vis.append('svg:text')
        .attr('class', 'y label')
        .attr('fill', 'black')
        .attr('transform', 'rotate(-90, 0,' + height + ')')
        .attr('text-anchor', 'middle')
        .attr('x', (height + margins.bottom) / 2)
        .attr('y', (height + margins.left) * 0.92)
        .text('Mean concentration (virions/m³)');

    // Legend bounding box.
    vis.append('rect')
        .attr('width', 275)
        .attr('height', 25 * (Object.keys(data_for_scenarios).length))
        .attr('x', width * 1.005)
        .attr('y', margins.top + 5)
        .attr('stroke', 'lightgrey')
        .attr('stroke-width', '2')
        .attr('rx', '5px')
        .attr('ry', '5px')
        .attr('stroke-linejoin', 'round')
        .attr('fill', 'none');
}


// Functions used to build the plots' components

function plot_title(vis, width, margin_top, title) {
    vis.append('svg:foreignObject')
        .attr('width', width)
        .attr('height', margin_top)
        .attr('fill', 'none')
        .append('xhtml:div')
        .style('text-align', 'center')
        .html(title);

    return vis;
}

function plot_x_axis(vis, height, width, margins, xAxis, label) {
    // X axis declaration
    vis.append('svg:g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (height - margins.bottom) + ')')
        .call(xAxis);

    // X axis label.
    vis.append('text')
        .attr('class', 'x label')
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .attr('x', (width + margins.right) / 2)
        .attr('y', height * 0.97)
        .text(label);

    return vis;
}

function plot_y_axis(vis, height, width, margins, yAxis, label) {
    // Y axis declaration.
    vis.append('svg:g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + margins.left + ',0)')
        .call(yAxis);

    // Y axis label.
    vis.append('svg:text')
        .attr('class', 'y label')
        .attr('fill', 'black')
        .attr('transform', 'rotate(-90, 0,' + height + ')')
        .attr('text-anchor', 'middle')
        .attr('x', (height + margins.bottom) / 2)
        .attr('y', (height + margins.left) * 0.92)
        .text(label);

    return vis;

}

function plot_scenario_data(vis, data, xTimeRange, yRange, line_color) {
    var lineFunc = d3.line()
        .defined(d => !isNaN(d.concentration))
        .x(d => xTimeRange(d.time))
        .y(d => yRange(d.concentration))
        .curve(d3.curveBasis);

    vis.append('svg:path')
        .attr('d', lineFunc(data))
        .attr("stroke", line_color)
        .attr('stroke-width', 2)
        .attr('fill', 'none');

    return vis;
}

function plot_cumulative_data(vis, data, xTimeRange, yCumulativeRange, line_color) {
    var lineCumulativeFunc = d3.line()
        .defined(d => !isNaN(d.cumulative_doses))
        .x(d => xTimeRange(d.time))
        .y(d => yCumulativeRange(d.cumulative_doses))
        .curve(d3.curveBasis);

    vis.append('svg:path')
        .attr('d', lineCumulativeFunc(data))
        .attr('stroke', line_color)
        .attr('stroke-width', 2)
        .style("stroke-dasharray", "5 5")
        .attr('fill', 'none');

    return vis;
}