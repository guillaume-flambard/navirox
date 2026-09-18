/**
 * Reading a declared version range, without resolving it.
 *
 * A project's manifest names a range, not a version, and no installed tree is
 * read, so the adapter works with the major the project declared. This is
 * neutral: every adapter needs the same reading to decide whether it was tested
 * against what a project asks for.
 *
 * It moved here from the adapters at the third copy, the same moment and for the
 * same reason as the graph mapper.
 */

/** The first number in a range, which is the major it is asking for. */
export function declaredMajor(range: string): number | undefined {
  const match = /\d+/.exec(range)
  return match === null ? undefined : Number(match[0])
}

/** The majors a list of tested ranges covers. */
export function testedMajors(versions: readonly string[]): readonly number[] {
  return versions
    .map((version) => declaredMajor(version))
    .filter((major): major is number => major !== undefined)
}
