import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadIcon from "@mui/icons-material/Download";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { useZohoInit } from "./hook/useZohoInit";
import { zohoApi } from "./zohoApi";
import { Table } from "./components/organisms/Table";
import { Dialog } from "./components/organisms/Dialog";

dayjs.extend(utc);
dayjs.extend(timezone);

const parentContainerStyle = {
  borderTop: "1px solid #BABABA",
  minHeight: "calc(100vh - 1px)",
  p: "1em",
};

function isInLastNDays(date, pre) {
  const now = dayjs();
  const daysAgo = now.subtract(pre, "day");
  return dayjs(date).isAfter(daysAgo);
}

const op = [
  { label: "All" },
  { label: "Last 7 days", preDay: 7 },
  { label: "Last 30 days", preDay: 30 },
];

function App() {
  const { module, recordId } = useZohoInit();
  const [initPageContent, setInitPageContent] = React.useState(
    <CircularProgress />
  );
  const [relatedListData, setRelatedListData] = React.useState();
  const [selectedRecordId, setSelectedRecordId] = React.useState();
  const [openEditDialog, setOpenEditDialog] = React.useState(false);
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [ownerList, setOwnerList] = React.useState();
  const [selectedOwner, setSelectedOwner] = React.useState();
  const [typeList, setTypeList] = React.useState();
  const [selectedType, setSelectedType] = React.useState();
  const [dateRange, setDateRange] = React.useState();
  const [keyword, setKeyword] = React.useState("");

  const handleClickOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleClickOpenEditDialog = () => {
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  React.useEffect(() => {
    const fetchRLData = async () => {
      const { data } = await zohoApi.record.getRecordsFromRelatedList({
        module,
        recordId,
        RelatedListAPI: "History3",
      });

      data?.length < 1
        ? setInitPageContent("No data")
        : setInitPageContent(undefined);

      const tempData = data?.map((obj) => ({
        id: obj?.id,
        date_time: obj?.History_Date_Time,
        type: obj?.History_Type,
        result: obj?.History_Result,
        duration: obj?.duration_min,
        regarding: obj?.Regarding,
        details: obj?.History_Details,
        icon: <DownloadIcon />,
        ownerName: obj?.Owner?.name,
      }));

      // console.log({ tempData });
      setRelatedListData(tempData);
      const owners = data
        ?.map((el) => el.Owner)
        ?.map((owner) => owner?.name)
        ?.filter((el) => el !== undefined)
        ?.filter((el) => el !== null);
      setOwnerList([...new Set(owners)]);

      const types = data
        ?.map((el) => el.History_Type)
        ?.filter((el) => el !== undefined)
        ?.filter((el) => el !== null);
      setTypeList([...new Set(types)]);
    };

    if (module && recordId) {
      fetchRLData();
    }
  }, [module, recordId]);

  let selectedObj = relatedListData?.filter(
    (obj) => obj?.id === selectedRecordId
  )?.[0];
  // console.log({ selectedObj });
  const regarding = selectedObj?.regarding;
  const details = selectedObj?.details;

  return (
    <React.Fragment>
      <Box sx={parentContainerStyle}>
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {initPageContent}
        </span>
        {relatedListData?.length > 0 ? (
          <Grid container spacing={2}>
            <Grid
              size={9}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                "& > *": { flexGrow: 1, flexBasis: "0px" },
              }}
            >
              <Autocomplete
                size="small"
                options={op}
                renderInput={(params) => (
                  <TextField {...params} label="Dates" />
                )}
                onChange={(e, value, reason) => {
                  setDateRange(value);
                }}
              />
              <Autocomplete
                size="small"
                options={typeList}
                renderInput={(params) => (
                  <TextField {...params} label="Types" />
                )}
                onChange={(e, value, reason) => {
                  setSelectedType(value);
                }}
              />
              <TextField
                size="small"
                label="Keyword"
                variant="outlined"
                onChange={(e) => {
                  setKeyword(e.target.value);
                }}
              />
              <Autocomplete
                size="small"
                options={ownerList}
                renderInput={(params) => (
                  <TextField {...params} label="Users" />
                )}
                onChange={(e, value, reason) => {
                  setSelectedOwner(value);
                }}
              />
            </Grid>
            <Grid size={3} sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                sx={{ flexGrow: 1 }}
                onClick={handleClickOpenCreateDialog}
              >
                Create
              </Button>
            </Grid>
            <Grid size={9}>
              <Table
                rows={relatedListData
                  ?.filter((el) => {
                    if (selectedOwner) {
                      return el.record_Manager.name === selectedOwner;
                    }
                    return true;
                  })
                  ?.filter((el) => {
                    if (selectedType) {
                      return el?.type === selectedType;
                    }
                    return true;
                  })
                  ?.filter(({ icon, record_Manager, ...el }) => {
                    const vals = Object.values(el)
                      ?.filter((el) => el !== undefined)
                      ?.filter((el) => el !== null);

                    const subArr = vals.filter((str) => str.includes(keyword));

                    return !!subArr?.length;
                  })
                  ?.filter((el) => {
                    if (dateRange?.preDay) {
                      // const ff = isInLastDays(el?.date_time, dateRange?.preDay);
                      // console.log({
                      //   ed: el?.date_time,
                      //   dp: dateRange?.preDay,
                      //   ff,
                      // });
                      return isInLastNDays(el?.date_time, dateRange?.preDay);
                    }
                    return true;
                  })}
                setSelectedRecordId={setSelectedRecordId}
                handleClickOpenEditDialog={handleClickOpenEditDialog}
              />
            </Grid>
            <Grid size={3}>
              <Paper
                sx={{
                  height: "100%",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: "1rem",
                    overflowY: "auto",
                  }}
                >
                  {!!regarding ? (
                    <span
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        padding: "4px",
                        backgroundColor: "rgba(236, 240, 241, 1)",
                        borderRadius: "4px",
                      }}
                    >
                      {regarding}
                    </span>
                  ) : null}

                  {details}
                  {!regarding && !details ? "No data" : null}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        ) : null}
      </Box>
      <Dialog
        openDialog={openEditDialog}
        handleCloseDialog={handleCloseEditDialog}
        obj={selectedObj}
        title="Edit History"
      />
      <Dialog
        openDialog={openCreateDialog}
        handleCloseDialog={handleCloseCreateDialog}
        title="Create"
      />
    </React.Fragment>
  );
}

export default App;
