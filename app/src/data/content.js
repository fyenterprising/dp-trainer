/*
 * Curriculum content — single load point
 * ======================================
 *
 * The 19 domain files and the 30-day curriculum are imported here once and
 * joined into the lookups every screen needs. Before this module existed each
 * consumer imported all twenty JSON files itself, which meant two copies of the
 * domain list that could silently drift apart.
 *
 * A curriculum slot names a task by id. Most slots resolve to a task record in
 * one of the domain files; the "buffer_*" slots deliberately do not — they carry
 * a `description` instead and stand for unstructured practice time. Anything
 * walking the curriculum has to handle both.
 */

import setupData from '../../../content/domains/setup.json'
import joystickData from '../../../content/domains/joystick-control.json'
import environmentalData from '../../../content/domains/environmental.json'
import sensorsData from '../../../content/domains/sensors.json'
import modeData from '../../../content/domains/mode-transitions.json'
import approachData from '../../../content/domains/approach.json'
import alarmsData from '../../../content/domains/alarms.json'
import failuresData from '../../../content/domains/failures.json'
import watchkeepingData from '../../../content/domains/watchkeeping.json'
import operationsData from '../../../content/domains/operations.json'
import reviewData from '../../../content/domains/review.json'
import asogData from '../../../content/domains/asog-cam-tam.json'
import dpDrillsData from '../../../content/domains/dp-drills.json'
import dpSystemsData from '../../../content/domains/dp-systems-and-modes.json'
import prsRedundancyData from '../../../content/domains/position-reference-and-redundancy.json'
import emergencyResponseData from '../../../content/domains/emergency-response.json'
import trialsAssuranceData from '../../../content/domains/dp-trials-and-assurance.json'
import drillConductData from '../../../content/domains/drill-conduct-and-debrief.json'
import tagosData from '../../../content/domains/tagos-power-strategy.json'
import curriculumData from '../../../content/curriculum.json'

export const allDomains = [
  setupData, joystickData, environmentalData, sensorsData, modeData,
  approachData, alarmsData, failuresData, watchkeepingData, operationsData, reviewData,
  asogData, dpDrillsData, dpSystemsData, prsRedundancyData, emergencyResponseData,
  trialsAssuranceData, drillConductData, tagosData,
]

export const curriculum = curriculumData.curriculum

export const taskById = {}
export const domainByTaskId = {}

allDomains.forEach(domain => {
  domain.tasks.forEach(t => {
    taskById[t.id] = t
    domainByTaskId[t.id] = domain
  })
})

// Printed on the export cover page, so it is counted rather than written down —
// a domain file or a curriculum day added later cannot leave the cover stale.
export const SCOPE = {
  domains: allDomains.length,
  tasks: Object.keys(taskById).length,
  days: curriculum.length,
}
