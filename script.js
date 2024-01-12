const DOMAIN_PADDING_LEFT = 5 * .25 * 16 // (TW) p-5 -> (REM) 1.25 -> (PX) 20
const SCROLL_TIME_RATIO = 1 / 25

const cached = {}

// card.shapeId (w, h, square), card.lvl (evolution level)
// cached -> { w: { lvl-0: { span, time }, lvl-n }, h, square }

const calculateOverflow = (domain) => {
    const wrapper = domain.parentElement.parentElement
    const spaceAvailable = wrapper.offsetWidth - (DOMAIN_PADDING_LEFT * 2)
    console.log(domain, domain.scrollWidth, spaceAvailable)
    if (domain.scrollWidth <= spaceAvailable) return { scrollable: false }

    const span = domain.scrollWidth - domain.offsetWidth
    return {
        span: `-${ span }px`,
        time: `${ span * SCROLL_TIME_RATIO }s`,
        scrollable: true
    }
}

const checkDomainOverflow = (domain, shapeId, lvl) => {
    console.log(domain, shapeId, lvl)

    const lvlStr = `lvl-${ lvl }`
    if (!cached[shapeId]) cached[shapeId] = {}

    let overflow = cached[shapeId][lvlStr]
    if (!overflow) {
        overflow = {
            ...overflow,
            [ lvlStr ] : {}
        }
        cached[shapeId][lvlStr] = overflow
    }

    // For `data-long` mobile responsive maybe do not cache `lvl-2`
    if (!overflow.span || !overflow.time) {
        const calculated = calculateOverflow(domain)
        cached[shapeId][lvlStr] = calculated
        overflow = calculated
    }

    if (overflow.scrollable) {
        domain.style.setProperty('--scroll-span', overflow.span)
        domain.style.setProperty('--scroll-time', overflow.time)
        domain.setAttribute('data-long', 'true')
    } else {
        domain.style.setProperty('--scroll-span', `0px`)
        domain.style.setProperty('--scroll-time', `0s`)
        domain.setAttribute('data-long', 'false')
    }
    console.log(cached)

    if (lvl === 1) domain.setAttribute('data-domain', 'true')
}

const transform = (e) => {
    const card = e.target.parentNode.parentNode.parentNode.parentNode
    const content = card.querySelector(`.card-content`)
    const toggle = !(card.getAttribute('data-transform') === 'true')
    card.setAttribute('data-transform', '' + toggle)

    setTimeout(() => {
        if (toggle) card.classList.add('card-transform')
        else card.classList.remove('card-transform')
    }, 150)

    switch (card.id) {
        case 'card1':
            content.classList.toggle('card-transform-rectangle-w')
            setTimeout(() => {
                const domain = content.querySelector('*[data-domain]')
                checkDomainOverflow(domain, card.id, toggle ? 1 : 0)
            }, 300);
            break
        case 'card2':
            content.classList.toggle('card-transform-rectangle-h')
            setTimeout(() => {
                const domain = content.querySelector('*[data-domain]')
                checkDomainOverflow(domain, card.id, toggle ? 1 : 0)
            }, 300);
            break
        case 'card3':
            content.classList.toggle('card-transform-square')
            setTimeout(() => {
                const domain = content.querySelector('*[data-domain]')
                checkDomainOverflow(domain, card.id, toggle ? 1 : 0)
            }, 300);
            break
    }
}

// Overlay
const overlay = document.querySelector('.overlay')
const dummy = overlay.querySelector('.dummy-block')

// Modal
const modal = overlay.querySelector('.modal-wrap')
const modalContent = modal.querySelector('.modal-content')
const modalHeader = modalContent.querySelector('.modal-header')
const modalBody = modalContent.querySelector('.modal-body')

// Dynamic Data
let headerContent
let isDoing = false

// Cooldowns
const TRANSITION_WAIT = 50
const DUMMY_TRANSITION = 300
const COLLAPSE_WAIT = 500
const COLLAPSE_DURATION = 500

const follow = (from, to) => {
    const rect = to.getBoundingClientRect()
    from.style.left = `${ rect.x }px`
    from.style.top = `${ rect.top }px`
    from.style.width = `${ rect.width }px`
    from.style.height = `${ rect.height }px`
}

const clearDummy = () => {
    dummy.innerHTML = ''
    dummy.style.left = ''
    dummy.style.top = ''
    dummy.style.width = ''
    dummy.style.height = ''
}

const openOverlay = (e) => {
    if (isDoing) return
    isDoing = true
    overlay.setAttribute('data-show', 'true')
    const card = e.currentTarget.parentNode.parentNode.parentNode.parentNode
    const content = card.querySelector('.card-content')
    const copyContent = content.cloneNode(true)

    // Sanitize
    copyContent.classList.remove('card-transform-rectangle-w')
    copyContent.classList.remove('card-transform-rectangle-h')
    copyContent.classList.remove('card-transform-square')
    copyContent.querySelector('*[data-domain]').setAttribute('data-long', 'false')
    copyContent.style.borderRadius = '10px'

    // First position in block transition
    follow(dummy, content)
    dummy.setAttribute('data-following', card.id)

    const tempHeaderContent = dummy.appendChild(copyContent)
    content.setAttribute('data-show', 'false')

    setTimeout(() => {
        follow(dummy, modalHeader)
        
        tempHeaderContent.style.borderRadius = '20px'
        /*;[ ...contentOverlay.children ].map(el => {
            if (el.getAttribute('data-required') !== null) return
            el.style.opacity = 0
        })*/
        setTimeout(() => {
            modal.setAttribute('data-invisible', 'false')
            headerContent = modalHeader.appendChild(copyContent)
            headerContent.style.borderBottomLeftRadius = '0px'
            headerContent.style.borderBottomRightRadius = '0px'
            clearDummy()
            setTimeout(() => {
                checkDomainOverflow(headerContent.querySelector('*[data-domain]'), card.id, 2)
            }, COLLAPSE_WAIT)
        }, DUMMY_TRANSITION)
        setTimeout(() => {
            modalContent.setAttribute('data-collapsed', 'true')
            setTimeout(() => isDoing = false, COLLAPSE_DURATION)
        }, COLLAPSE_WAIT)
    }, TRANSITION_WAIT)
}

const closeOverlay = (e=undefined, checkIfOverlay=false, ignoreDoing=false) => {
    if (isDoing && !ignoreDoing) return
    isDoing = true
    if (!checkIfOverlay || e?.target.classList.contains('overlay')) ''
    else return
    
    const following = document.querySelector(`#${ dummy.getAttribute('data-following') } .card-content`)
    const domain = headerContent.querySelector('*[data-domain]')
    domain.setAttribute('data-long', 'false')
    setTimeout(() => {

        modalContent.setAttribute('data-collapsed', 'false')
    
        setTimeout(() => {
            headerContent.style.borderBottomLeftRadius = '20px'
            headerContent.style.borderBottomRightRadius = '20px'
            modal.setAttribute('data-invisible', 'true')
            const tempHeaderContent = dummy.appendChild(headerContent.cloneNode(true))
            follow(dummy, modalHeader)
            modalHeader.innerHTML = ''
            setTimeout(() => {
                follow(dummy, following)
                tempHeaderContent.style.borderRadius = '10px'
                tempHeaderContent.style.borderBottomLeftRadius = '10px'
                tempHeaderContent.style.borderBottomRightRadius = '10px'
                overlay.setAttribute('data-show', 'false')
    
                // Restart `data-long` anim
                const followingDomain = following.querySelector('*[data-domain]')
                followingDomain.style.animation = 'none'
                followingDomain.offsetHeight // Reflow, restart anim by 0
                followingDomain.style.animation = null
                checkDomainOverflow(followingDomain, following.parentElement.id, 1)
                setTimeout(() => {
                    following.setAttribute('data-show', 'true')
                    setTimeout(() => {
                        clearDummy()
                        isDoing = false
                    }, 300)
                }, 350)
            }, 200)
        }, COLLAPSE_WAIT)
    }, 100)
}

const toast = document.querySelector('.toast-wrapper')
let isToasting = false
const TOAST_LIFE_SPAN = 3e3

const handleToast = (show) => {
    if (!show) {
        toast.setAttribute('data-show', 'false')
        isToasting = false
        return
    }
    if (isToasting) return
    toast.setAttribute('data-show', 'true')
    isToasting = true
    setTimeout(() => {
        if (!isToasting) return
        handleToast(false)
        isToasting = false
    }, TOAST_LIFE_SPAN)
}

const copyAttribute = (e, showToast=true) => {
    const element = e.currentTarget.querySelector('*[data-copy]')
    navigator.clipboard.writeText(element.innerText)
    if (showToast) handleToast(true)
}

document.addEventListener("DOMContentLoaded", () => {
    const domains = Array.from(document.querySelectorAll('*[data-domain]'))
    for (let domain of domains) {
        checkDomainOverflow(domain, domain.parentElement.parentElement.parentElement.parentElement.id, 0)
    }
})