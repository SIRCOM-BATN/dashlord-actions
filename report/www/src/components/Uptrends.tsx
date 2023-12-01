import * as React from "react";
import { Row, Col, Alert, CardDescription } from "@dataesr/react-dsfr";
import { format } from "date-fns";
import frLocale from "date-fns/locale/fr";

import { Panel } from "./Panel";
import { Gauge } from "./Gauge";
import { Grade } from "./Grade";
import { smallUrl } from "../utils";
import Card from "./Card";

import styles from "./updownIo.module.scss";

type UpTrendsProps = { data: UpTrendsReport; url: string };

export const UpTrends: React.FC<UpTrendsProps> = ({ data, url }) => {
  const urlUptrends = (data && `https://app.uptrends.com/Report/ProbeDashboardGeneric?probeGuids=${data.monitorGuid}`) || null;
  return (
    (urlUptrends && smallUrl(data.url) === smallUrl(url) && data.monitorGuid != null && (
      <Panel
        title="Disponibilité et temps de réponse"
        info="Informations collectées par uptrends"
        url={urlUptrends}
        urlText="Statistiques détaillées"
        isExternal
      >
        <Row>
          <Col n="12 sm-12 md-4" className="fr-mb-3w">
            <Card
              title="Taux de disponibilité sur un mois glissant"
              value={`${(data.last30Days.uptime * 100).toFixed(2)}%`}
            >
              <Gauge
                width={200}
                height={120}
                value={data.last30Days.uptime * 100}
                minValue={0}
                maxValue={100}
                segments={3}
                currentValueText=""
              />
            </Card>
          </Col>

          {data.last30Days && data.last30Days.averageTime && (
            <Col n="12 sm-12 md-4" className="fr-mb-3w">
              <Card
                title="Temps de réponse moyen sur un mois glissant"
                value={`${data.last30Days.averageTime * 1000 }ms`}
              >
                <Gauge
                  width={200}
                  height={120}
                  value={Math.max(0, data.last30Days.averageTime * 1000)}
                  minValue={0}
                  maxValue={2000}
                  customSegmentStops={[0, 150, 500, 1000, 1500, 2000]}
                  reverseColors={true}
                  currentValueText=""
                />
              </Card>
            </Col>
          )}
        </Row>
        <Row>
          {data?.currentYear?.uptime !== undefined && (
            <Col n="12 sm-12 md-4" className="fr-mb-3w">
              <Card
                title="Taux de disponibilité sur l'année"
                value={`${(data.currentYear.uptime * 100).toFixed(2)}%`}
              >
                <Gauge
                  width={200}
                  height={120}
                  value={data.currentYear.uptime * 100 }
                  minValue={0}
                  maxValue={100}
                  segments={3}
                  currentValueText=""
                />
              </Card>
            </Col>
          )}

          {data.currentYear && data.currentYear.averageTime && (
            <Col n="12 sm-12 md-4" className="fr-mb-3w">
              <Card
                title="Temps de réponse moyen annuel"
                value={`${data.currentYear.averageTime * 1000 }ms`}
              >
                <Gauge
                  width={200}
                  height={120}
                  value={Math.max(0, data.currentYear.averageTime * 1000)}
                  minValue={0}
                  maxValue={2000}
                  customSegmentStops={[0, 150, 500, 1000, 1500, 2000]}
                  reverseColors={true}
                  currentValueText=""
                />
              </Card>
            </Col>
          )}
        </Row>
      </Panel>
    )) || (
      <Panel
        title="Temps de réponse"
        info="Informations collectées par uptrends"
      >
        <Alert
            type="warning"
            title="Pas de données"
            description="Aucune donnée uptrends associée"
          />
      </Panel>
    )
  );
};
