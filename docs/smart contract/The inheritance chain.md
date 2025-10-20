```
IGovernor (defines votingDelay, votingPeriod, quorum, etc.)
    ↑
    └── Governor (implements IGovernor)
            ↑
            └── GovernorSettings (extends Governor)
                    ↑
                    └── Your AfriDAO (extends both)

```