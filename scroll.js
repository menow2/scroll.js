let scroller = (layout, container, debug) => {
  document.querySelector('.container').style.marginBottom =
    window.innerHeight + 'px'

  let viz = d3.select(container),
      sectionIndex = 0,
      currentIndex = Infinity,
      yOffset = 0,
      {heightArray, drawArray, fixedArray} = createScrollHeightArray(layout)

  if(debug){
    console.log('heightArray', heightArray)
    console.log('drawArray', drawArray)
    console.log('fixedArray', fixedArray)
    d3.selectAll('div').style('border', '1px solid red')
    debugLines(heightArray)
  }

  scrollListener = (e) => {
    yOffset = window.pageYOffset - 1
    sectionIndex = d3.bisect(heightArray, yOffset)

    if (currentIndex !== sectionIndex) {
      // remove the old fixed chart
      fixedArray[currentIndex]? fixedArray[currentIndex].classed('fixedChart', false) : null

      // change the curentIndex
      currentIndex = sectionIndex
      if(debug){
        console.log(currentIndex)
      }

      // add the new fixed chart
      fixedArray[currentIndex]? fixedArray[currentIndex].classed('fixedChart', true) : null

      // run the animation
      if(currentIndex < drawArray.length){
        drawArray[currentIndex]()
      }
    }
  }

  document.addEventListener('scroll', scrollListener)
  scrollListener()
}

function createScrollHeightArray(layout) {
  let currentHeight = 0,
      sumHeights = 0,
      rowHeight = 0,
      heightArray = [],
      drawArray = [],
      fixedArray = []

  layout.forEach(row => {
    // We set the height in the layout file instead of CSS
    row.el.style('height', row.height + 'px')

    // row height is set to a variable that we can subtract
    // from if there are animations
    rowHeight = row.height

    // sets up the draw function for the row; if one isn't provided we
    // push an empty function
    row.draw ? drawArray.push(row.draw) : drawArray.push(()=>{})

    if(row.gap){
      d3.select(row.el.node().parentNode).style('margin-top', row.gap + 'px')
      sumHeights += row.gap
      heightArray.push(sumHeights)
      drawArray.push(()=>{})
      fixedArray.push(null)
    }

    // Checks the row type and if an animation exists for the row
    if (row.type === 'header') {
      fixedArray.push(null)
      console.log('type is header so no animations')
    } else if (row.type === 'chart') {
      fixedArray.push(row.chartEl)
      console.log('type is chart so we check for animations')
      try {
        row.animations.forEach(anim => {

          // current height set to a proportion of the layout height
          currentHeight = anim.height * row.height

          // remaining height decremented as it has been filled
          rowHeight -= currentHeight

          // since the height is relative to the documents height we need to
          // sum all heights to get the actual height marker on the document
          sumHeights += currentHeight
          heightArray.push(sumHeights)
          fixedArray.push(row.chartEl)

          // sets the draw animation if it was provided; empty if not provided
          anim.draw ? drawArray.push(anim.draw) : drawArray.push(()=>{})
        })
      } catch (error) {
        console.log('there was no animations or it was incorrectly formed')
      }
    } else {
      console.log('Something went wrong')
    }

    // setting the remaining height after the animation heights to maintain
    // the desired height that was input into the layout
    sumHeights += rowHeight
    heightArray.push(sumHeights)
  })

  // returning both arrays to the main scroller function
  return {heightArray, drawArray, fixedArray}
}

function debugLines(heightArray) {
  let debugSvg = d3.select('body')
    .append('svg')
    .attr('height', document.body.scrollHeight)
    .attr('width', 100)
    .style('position', 'absolute')
    .style('left', 0)
    .style('top', 0)

  heightArray.forEach((line, i) => {
    debugSvg.append('rect')
    .attr('x', 0)
    .attr('y', line)
    .attr('width', 100)
    .attr('height', 2)
    debugSvg.append('text')
    .attr('x', 20)
    .attr('y', line+20)
    .attr('font-family', 'Arial')
    .attr('font-size', '18px')
    .attr('fill', 'black')
    .text(i)
  })
}
